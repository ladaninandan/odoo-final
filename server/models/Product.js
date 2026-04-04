import mongoose from 'mongoose';

const variantValueSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    extraPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    attribute: { type: String, required: true },
    values: [variantValueSchema],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'piece' },
    taxRate: { type: Number, default: 5 },
    description: { type: String, default: '' },
    sendToKitchen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    variants: [variantSchema],
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for fast category filter + search
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
