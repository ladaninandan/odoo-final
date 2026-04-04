import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  googleLogin,
  requestOtp,
  verifyOtpAndResetPassword,
  refreshTokenFlow,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/google', googleLogin);

// Forgot Password Flow
router.post('/request-otp', requestOtp);
router.post('/reset-password', verifyOtpAndResetPassword);

// Token Refresh Flow
router.post('/refresh', refreshTokenFlow);

router.get('/me', protect, getMe);

export default router;
