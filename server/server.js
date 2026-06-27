import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import reportRoutes from './routes/reports.js';

// Seed Helper
import Product from './models/Product.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Sales & Inventory API is running.' });
});

// Seed Initial Inventory Products (if empty)
const seedInventory = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      // Import Shop model dynamically or directly to look up first shop
      const Shop = mongoose.model('Shop');
      const firstShop = await Shop.findOne();
      if (firstShop) {
        const demoProducts = [
          { shopId: firstShop._id, name: 'Organic Coffee Beans (1kg)', category: 'Grocery', price: 24.99, stockQuantity: 45, lowStockThreshold: 10 },
          { shopId: firstShop._id, name: 'Double-walled Glass Mug', category: 'Kitchenware', price: 12.50, stockQuantity: 8, lowStockThreshold: 10 }, 
          { shopId: firstShop._id, name: 'Eco-friendly Straws (50 pack)', category: 'Kitchenware', price: 4.99, stockQuantity: 120, lowStockThreshold: 20 },
          { shopId: firstShop._id, name: 'Premium Matcha Powder (100g)', category: 'Grocery', price: 19.99, stockQuantity: 5, lowStockThreshold: 10 }, 
          { shopId: firstShop._id, name: 'French Press Coffee Maker', category: 'Kitchenware', price: 34.95, stockQuantity: 15, lowStockThreshold: 5 }
        ];
        await Product.insertMany(demoProducts);
        console.log('Successfully seeded database with starter products for the first shop.');
      } else {
        console.log('No registered shops found. Skipping starter product seed.');
      }
    }
  } catch (err) {
    console.error('Error seeding starter products:', err.message);
  }
};

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales_inventory')
  .then(async () => {
    console.log('MongoDB connected successfully.');
    await seedInventory();
    
    // Start Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });
