import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: [0, 'Stock quantity cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 10,
    min: [0, 'Threshold cannot be negative']
  }
}, {
  timestamps: true
});

// We can add a compound index so name is unique per shop
productSchema.index({ shopId: 1, name: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
