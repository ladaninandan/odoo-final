import mongoose from 'mongoose';

/** Revoked JWT access tokens (logout) — TTL cleans expired rows */
const schema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AccessTokenBlacklist', schema);
