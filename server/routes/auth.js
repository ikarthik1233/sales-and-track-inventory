import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@business.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

    // Single shared user login validation
    if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: adminEmail },
      process.env.JWT_SECRET || 'supersecrettokenkey123_change_this_in_production',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        email: adminEmail
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

export default router;
