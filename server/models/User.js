import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String },
    name: { type: String }, // optional legacy fallback
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },

    password_hash: { type: String },
    password: { type: String }, // legacy testing fallback

    is_verified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active' },
    role: { type: String, enum: ['admin', 'cashier', 'kitchen'], default: 'cashier' },

    last_login_at: { type: Date },
    last_login_ip: { type: String },

    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, default: null },
    picture: { type: String, default: '' },
    email_verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  const hash = this.password_hash || this.password;
  if (!hash) return false;
  return await bcrypt.compare(enteredPassword, hash);
};

// Ensure legacy users have first_name before validation
userSchema.pre('validate', function () {
  if (!this.first_name) {
    if (this.name) {
      const splitName = this.name.split(' ');
      this.first_name = splitName[0];
      this.last_name = splitName.slice(1).join(' ') || '';
    } else {
      this.first_name = 'User';
    }
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password_hash') || !this.password_hash) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

const User = mongoose.model('User', userSchema);
export default User;