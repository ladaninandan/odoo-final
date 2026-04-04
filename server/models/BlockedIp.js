import mongoose from 'mongoose';

const blockedIpSchema = mongoose.Schema(
  {
    ip_address: { type: String, required: true, unique: true },
    reason: { type: String },
    blocked_until: { type: Date, required: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Indexes for performance and TTL
blockedIpSchema.index({ ip_address: 1, blocked_until: 1 });
blockedIpSchema.index({ blocked_until: 1 }, { expireAfterSeconds: 0 });

const BlockedIp = mongoose.model('BlockedIp', blockedIpSchema);
export default BlockedIp;
