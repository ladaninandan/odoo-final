import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    variant: { type: String, default: '' },
    subtotal: { type: Number, required: true },
    kitchenStatus: {
      type: String,
      enum: ['pending', 'to_cook', 'preparing', 'completed'],
      default: 'pending',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent_to_kitchen', 'ready', 'paid', 'cancelled'],
      default: 'draft',
    },
    source: {
      type: String,
      enum: ['pos', 'self_order'],
      default: 'pos',
    },
    selfOrderToken: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes for common queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ session: 1 });
orderSchema.index({ table: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
