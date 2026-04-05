import mongoose from 'mongoose';

/**
 * QR self-order link for a table.
 * Valid while `active` — invalidated when the table becomes available again (after payment / release).
 * `expiresAt` is a far-future date; validity is driven by `active`, not TTL.
 */
const schema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    tableNumber: { type: Number, required: true },
    /** When false, link is dead — table was freed; next guest needs a new QR */
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ tableId: 1, active: 1 });

export default mongoose.model('SelfOrderLink', schema);
