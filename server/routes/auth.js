import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';
import Shop from '../models/Shop.js';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key'); // Initialize Resend API client

// Register new Shop
router.post('/register', async (req, res) => {
  try {
    const { shopName, ownerName, email, password, phone, address } = req.body;

    if (!shopName || !ownerName || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const existingShop = await Shop.findOne({ email: email.toLowerCase() });
    if (existingShop) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newShop = new Shop({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : ''
    });

    const savedShop = await newShop.save();

    const token = jwt.sign(
      { shopId: savedShop._id, email: savedShop.email },
      process.env.JWT_SECRET || 'supersecrettokenkey123_change_this_in_production',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: savedShop._id,
        shopName: savedShop.shopName,
        ownerName: savedShop.ownerName,
        email: savedShop.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// Login Shop
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const shop = await Shop.findOne({ email: email.toLowerCase() });
    if (!shop) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, shop.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { shopId: shop._id, email: shop.email },
      process.env.JWT_SECRET || 'supersecrettokenkey123_change_this_in_production',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: shop._id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        email: shop.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

// Forgot Password Flow
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const shop = await Shop.findOne({ email: email.toLowerCase().trim() });
    
    // Security best practice: Respond with success regardless of whether email exists
    const genericSuccessResponse = { message: 'If that email exists, a reset link has been sent' };

    if (!shop) {
      return res.json(genericSuccessResponse);
    }

    // Generate secure token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    shop.resetPasswordToken = token;
    shop.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms
    await shop.save();

    // Construct reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    // Send email using Resend
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Default sender for free tier
      to: shop.email,
      subject: 'Reset Password - Track & Sell POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2e3628; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Reset Your Password</h2>
          <p>We received a request to reset your password for your <strong>${shop.shopName}</strong> account.</p>
          <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #5c6b52; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 0.85rem; color: #75826c;">
            Or copy and paste this URL into your browser:<br />
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 0.8rem; color: #9ca3af;">
            If you did not request a password reset, please ignore this email. Your password will remain secure.
          </p>
        </div>
      `
    });

    res.json(genericSuccessResponse);
  } catch (err) {
    res.status(500).json({ message: 'Error processing forgot password request', error: err.message });
  }
});

// Reset Password Action
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Find shop with matching token and expiry in the future
    const shop = await Shop.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!shop) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    shop.password = hashedPassword;
    shop.resetPasswordToken = undefined; // clear token
    shop.resetPasswordExpires = undefined; // clear expiry
    await shop.save();

    res.json({ message: 'Password has been successfully updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password', error: err.message });
  }
});

export default router;
