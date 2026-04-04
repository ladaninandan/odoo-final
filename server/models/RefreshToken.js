import mongoose from 'mongoose';

const refreshTokenSchema = mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Indexes for performance and TTL auto-cleanup
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ user_id: 1 });
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
