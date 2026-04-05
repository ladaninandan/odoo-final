import User from '../../models/User.js';
import UserSession from '../../models/UserSession.js';
import RefreshToken from '../../models/RefreshToken.js';
import PasswordResetOtp from '../../models/PasswordResetOtp.js';
import generateOtp from '../../utils/generateOtp.js';
import { sendEmail } from '../../config/nodemailer.js';

export const requestOtp = async (req, res) => {
  const { identifier, method } = req.body;

  const searchParam = method === 'email' || identifier.includes('@')
    ? { email: identifier }
    : { phone: identifier };

  const user = await User.findOne(searchParam);

  if (!user) {
    return res.status(404).json({ message: 'User not found in our records' });
  }

  const otp = generateOtp();
  await PasswordResetOtp.deleteMany({ identifier });
  await PasswordResetOtp.create({
    identifier,
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    if (identifier.includes('@') || method === 'email') {
      console.log(`Sending OTP ${otp} via email to ${identifier}`);
      await sendEmail(identifier, "Your Password Reset OTP", `Your verification code is ${otp}. It is valid for 10 minutes.`);
    } else {
      console.log(`Sending OTP ${otp} via SMS to ${identifier}`);
      const { sendSms } = await import('../../utils/sendSms.js');
      await sendSms(identifier, `Your auth code is ${otp}`);
    }
    res.status(200).json({ message: `OTP sent successfully to ${identifier}` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

export const verifyOtpAndResetPassword = async (req, res) => {
  const { identifier, otp, newPassword } = req.body;

  const otpDoc = await PasswordResetOtp.findOneAndDelete({
    identifier,
    code: otp,
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.password_hash = newPassword;
  await user.save();

  await RefreshToken.updateMany({ user_id: user._id }, { $set: { is_revoked: true } });
  await UserSession.updateMany(
    { user_id: user._id, is_active: true },
    { $set: { is_active: false, logout_time: new Date() } }
  );

  res.status(200).json({ message: 'Password reset successful' });
};
