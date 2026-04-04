import mongoose from 'mongoose';

/** QR self-order link payload (time-limited) */
const schema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    tableNumber: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('SelfOrderLink', schema);
