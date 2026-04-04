import User from '../../models/User.js';
import BlockedIp from '../../models/BlockedIp.js';
import LoginAttempt from '../../models/LoginAttempt.js';
import RefreshToken from '../../models/RefreshToken.js';
import UserSession from '../../models/UserSession.js';
import redisClient from '../../config/redis.js';
import mongoose from 'mongoose';
import { generateTokens } from './authUtils.js';

export const loginUser = async (req, res) => {
  const { email, phone, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  // 1. Security Tracking: Check if this IP or Email is blocked
  const blockedIp = await BlockedIp.findOne({ ip_address: ip, blocked_until: { $gt: new Date() } });
  if (blockedIp) return res.status(403).json({ message: 'IP is temporarily blocked due to too many failed attempts' });

  if (email) {
    const blockedEmail = await BlockedIp.findOne({ ip_address: `email:${email}`, blocked_until: { $gt: new Date() } });
    if (blockedEmail) return res.status(403).json({ message: 'Account is temporarily blocked due to too many failed attempts' });
  }

  let user;
  if (email) {
    user = await User.findOne({ email });
  } else if (phone) {
    user = await User.findOne({ phone });
  }

  if (user && (await user.matchPassword(password))) {
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active. Contact an administrator.' });
    }

    const sessionId = new mongoose.Types.ObjectId();
    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);

    // 2. Advanced Auth: Save Refresh Token strictly in Mongo
    await RefreshToken.create({
      user_id: user._id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Save to Redis explicitly for device-level logout
    await redisClient.set(`session:refresh:${user._id}:${sessionId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    // 3. Multi-Device Tracking: Record this successfully authenticated session
    await UserSession.create({
      _id: sessionId,
      user_id: user._id,
      token: refreshToken,
      ip_address: ip,
      user_agent: userAgent
    });

    // 4. Update Core Identity Identity Meta Data
    user.last_login_at = new Date();
    user.last_login_ip = ip;
    await user.save();

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.first_name,
      first_name: user.first_name,
      last_name: user.last_name || '',
      email: user.email,
      role: user.role,
      accessToken,
    });
  } else {
    // 5. Security Tracking: Log Failed Attempt
    await LoginAttempt.create({ email, ip_address: ip, user_agent: userAgent, success: false, failure_reason: 'wrong_credentials' });

    // Check thresholds for blocking
    const recentFailsByIp = await LoginAttempt.countDocuments({
      ip_address: ip, success: false, attempt_time: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
    });

    let recentFailsByEmail = 0;
    if (email) {
      recentFailsByEmail = await LoginAttempt.countDocuments({
        email, success: false, attempt_time: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
      });
    }

    if (recentFailsByIp >= 5) {
      await BlockedIp.updateOne(
        { ip_address: ip },
        { $set: { reason: 'too_many_attempts_ip', blocked_until: new Date(Date.now() + 15 * 60 * 1000) } },
        { upsert: true }
      );
    }

    if (recentFailsByEmail >= 10) {
      await BlockedIp.updateOne(
        { ip_address: `email:${email}` },
        { $set: { reason: 'too_many_attempts_email', blocked_until: new Date(Date.now() + 15 * 60 * 1000) } },
        { upsert: true }
      );
    }

    res.status(401).json({ message: 'Invalid credentials' });
  }
};
