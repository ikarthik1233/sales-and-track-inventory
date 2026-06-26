import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving products', error: err.message });
  }
});

// POST create a product
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, price, stockQuantity, lowStockThreshold } = req.body;

    if (!name || !category || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    const newProduct = new Product({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// PUT update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, price, stockQuantity, lowStockThreshold } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) {
      const existingProduct = await Product.findOne({ 
        name: name.trim(), 
        _id: { $ne: req.params.id } 
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'Another product with this name already exists' });
      }
      product.name = name.trim();
    }

    if (category) product.category = category.trim();
    if (price !== undefined) product.price = Number(price);
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// DELETE a product
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

export default router;
