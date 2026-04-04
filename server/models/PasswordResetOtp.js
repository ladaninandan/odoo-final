import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ identifier: 1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PasswordResetOtp', schema);
