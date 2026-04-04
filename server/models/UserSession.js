import mongoose from 'mongoose';

const userSessionSchema = mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    ip_address: { type: String },
    user_agent: { type: String },
    is_active: { type: Boolean, default: true },
    login_time: { type: Date, default: Date.now },
    logout_time: { type: Date }
  },
  { timestamps: true }
);

// Indexes
userSessionSchema.index({ user_id: 1, is_active: 1 });

const UserSession = mongoose.model('UserSession', userSessionSchema);
export default UserSession;
