import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET sales history with filters
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // include the entire end day
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

// POST record a new sale
router.post('/', auth, async (req, res) => {
  try {
    console.log('Backend POST /api/sales received req.body:', req.body);
    const { items, finalTotal, customerName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required' });
    }

    const processedItems = [];
    let calculatedTotal = 0;

    // Step 1: Validate stock and build sale items with current pricing
    for (const cartItem of items) {
      const { productId, quantity } = cartItem;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Invalid product id or quantity' });
      }

      const product = await Product.findById(productId);
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

    // Step 2: Deduct stock from database
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    // Step 3: Save transaction record
    const newSale = new Sale({
      items: processedItems,
      calculatedTotal,
      // If finalTotal is not specified or edited, default to calculatedTotal
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

// POST refund/cancel a sale (restores inventory)
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale record not found' });
    }

    // Restore stock for all products in the sale
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    // Delete the sale record or mark it as refunded. Let's delete it for inventory simplicity or keep history.
    // Deleting is requested, let's delete the record.
    await Sale.findByIdAndDelete(req.params.id);

    res.json({ message: 'Sale refunded successfully and stock levels restored', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Error processing refund', error: err.message });
  }
});

export default router;
