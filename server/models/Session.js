import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    openingBalance: { type: Number, required: true, default: 0 },
    closingBalance: { type: Number, default: null },
    totalSales: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sessionSchema.index({ status: 1, openedBy: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
