import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET daily report: /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', auth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter (YYYY-MM-DD) is required' });
    }

    // Set boundaries using local date boundary parsing
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Aggregate daily stats
    const summary = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalTotal' },
          transactionCount: { $sum: 1 },
          originalTotalRevenue: { $sum: '$calculatedTotal' }
        }
      }
    ]);

    // Aggregate items sold
    const itemsSold = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          price: { $first: '$items.price' }, // sale unit price
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      date,
      totalRevenue: summary[0]?.totalRevenue || 0,
      transactionCount: summary[0]?.transactionCount || 0,
      originalTotalRevenue: summary[0]?.originalTotalRevenue || 0,
      itemsSold
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating daily report', error: err.message });
  }
});

// GET dashboard summary stats: /api/reports/summary
router.get('/summary', auth, async (req, res) => {
  try {
    // 1. Today's stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999`);

    const todayStats = await Sale.aggregate([
      {
        $match: {
          date: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$finalTotal' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // 2. Low stock items
    const lowStockProducts = await Product.find({
      $expr: { $lt: ['$stockQuantity', '$lowStockThreshold'] }
    }).sort({ stockQuantity: 1 });

    // 3. 7-Day Trend Chart
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayStart = new Date(`${dateStr}T00:00:00`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999`);

      const dayStats = await Sale.aggregate([
        {
          $match: {
            date: { $gte: dayStart, $lte: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$finalTotal' }
          }
        }
      ]);

      trendDays.push({
        date: dateStr,
        label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
        totalSales: dayStats[0]?.totalSales || 0
      });
    }

    res.json({
      todaySales: todayStats[0]?.totalSales || 0,
      todayTransactions: todayStats[0]?.transactionCount || 0,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      trend: trendDays
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating dashboard summary', error: err.message });
  }
});

export default router;
