import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    method: {
      type: String,
      enum: ['cash', 'digital', 'upi'],
      required: true,
    },
    amount: { type: Number, required: true },
    upiId: { type: String, default: '' },
    qrCode: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ session: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
