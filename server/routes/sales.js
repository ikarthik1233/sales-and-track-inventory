import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET sales history with filters for the logged-in shop
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const query = { shopId: req.shopId }; // Filter by active shopId

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Product filter
    if (productId) {
      query['items.productId'] = productId;
    }

    const sales = await Sale.find(query).sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving sales history', error: err.message });
  }
});

// POST record a new sale for the logged-in shop
router.post('/', auth, async (req, res) => {
  try {
    const { items, finalTotal, customerName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required' });
    }

    const processedItems = [];
    let calculatedTotal = 0;

    // Step 1: Validate stock from products belonging to this shop
    for (const cartItem of items) {
      const { productId, quantity } = cartItem;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Invalid product id or quantity' });
      }

      const product = await Product.findOne({ _id: productId, shopId: req.shopId });
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${quantity}` 
        });
      }

      const itemPrice = product.price;
      const subtotal = itemPrice * quantity;
      calculatedTotal += subtotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity,
      });
    }

    // Step 2: Deduct stock from active shop's database inventory
    for (const item of processedItems) {
      await Product.findOneAndUpdate(
        { _id: item.productId, shopId: req.shopId },
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    // Step 3: Save transaction record with shopId
    const newSale = new Sale({
      shopId: req.shopId,
      items: processedItems,
      calculatedTotal,
      finalTotal: finalTotal !== undefined && finalTotal !== null ? Number(finalTotal) : calculatedTotal,
      customerName: customerName !== undefined ? String(customerName) : "",
      date: new Date()
    });

    const savedSale = await newSale.save();
    res.status(201).json(savedSale);
  } catch (err) {
    res.status(500).json({ message: 'Error processing sale', error: err.message });
  }
});

// POST refund/cancel a sale for the logged-in shop (restores inventory)
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, shopId: req.shopId });
    if (!sale) {
      return res.status(404).json({ message: 'Sale record not found in your shop history' });
    }

    // Restore stock for all products in the active shop's inventory
    for (const item of sale.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, shopId: req.shopId },
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    // Delete the sale record belonging to this shop
    await Sale.findOneAndDelete({ _id: req.params.id, shopId: req.shopId });

    res.json({ message: 'Sale refunded successfully and stock levels restored', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Error processing refund', error: err.message });
  }
});

export default router;
