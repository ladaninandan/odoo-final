import User from '../../models/User.js';
import redisClient from '../../config/redis.js';
import generateOtp from '../../utils/generateOtp.js';
import { sendEmail } from '../../config/nodemailer.js';

export const requestOtp = async (req, res) => {
  const { identifier, method } = req.body; // method should be 'email' or 'phone'

  // You can also determine method automatically if method string isn't sent
  const searchParam = method === 'email' || identifier.includes('@')
    ? { email: identifier }
    : { phone: identifier };

  const user = await User.findOne(searchParam);

  if (!user) {
    return res.status(404).json({ message: 'User not found in our records' });
  }

  const otp = generateOtp();
  // Cache for 10 mins (600 seconds)
  await redisClient.set(`otp:${identifier}`, otp, 'EX', 600);

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

  const storedOtp = await redisClient.get(`otp:${identifier}`);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.password_hash = newPassword; // Will be hashed by mongoose hook
  await user.save();

  // Clear otp and all sessions
  await redisClient.del(`otp:${identifier}`);
  await redisClient.del(`session:refresh:${user._id}`);

  res.status(200).json({ message: 'Password reset successful' });
};
