import mongoose from 'mongoose';

const loginAttemptSchema = mongoose.Schema(
  {
    email: { type: String },
    ip_address: { type: String, required: true },
    user_agent: { type: String },
    success: { type: Boolean, required: true },
    failure_reason: { type: String },
    attempt_time: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: 'attempt_time', updatedAt: false } }
);

// Indexes for performance and hot paths
loginAttemptSchema.index({ ip_address: 1, attempt_time: 1 });
loginAttemptSchema.index({ email: 1, attempt_time: 1 });

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);
export default LoginAttempt;
