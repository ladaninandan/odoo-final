import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['cash', 'digital', 'upi'],
      required: true,
      unique: true,
    },
    isEnabled: { type: Boolean, default: true },
    upiId: { type: String, default: '' },
  },
  { timestamps: true }
);

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
