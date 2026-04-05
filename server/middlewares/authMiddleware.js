import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import RefreshToken from '../models/RefreshToken.js';
import AccessTokenBlacklist from '../models/AccessTokenBlacklist.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_here';

async function sessionValidInDatabase(userId, sessionId) {
  if (!sessionId) return false;
  try {
    const sid = mongoose.Types.ObjectId.isValid(sessionId)
      ? new mongoose.Types.ObjectId(sessionId)
      : sessionId;
    const uid = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const session = await UserSession.findOne({
      _id: sid,
      user_id: uid,
      is_active: true,
    }).lean();
    if (!session) return false;
    const rt = await RefreshToken.findOne({
      token: session.token,
      is_revoked: false,
    }).lean();
    return !!rt;
  } catch {
    return false;
  }
}

async function hasActiveRefreshToken(userId) {
  try {
    const uid = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const doc = await RefreshToken.findOne({ user_id: uid, is_revoked: false }).lean();
    return !!doc;
  } catch {
    return false;
  }
}

export const protect = async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let token;
  try {
    token = req.headers.authorization.split(' ')[1];

    const blacklisted = await AccessTokenBlacklist.findOne({ token }).lean();
    if (blacklisted) {
      return res.status(401).json({ message: 'Not authorized, token revoked' });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const { id, sessionId } = decoded;

    let sessionOk = false;
    if (sessionId) {
      sessionOk = await sessionValidInDatabase(id, sessionId);
    } else {
      sessionOk = await hasActiveRefreshToken(id);
    }

    if (!sessionOk) {
      return res.status(401).json({
        message: 'Session expired or invalid. Please log in again.',
      });
    }

    const user = await User.findById(id).select('-password_hash');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message:
          error.name === 'TokenExpiredError'
            ? 'Session expired. Please log in again.'
            : 'Not authorized, token invalid',
      });
    }
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
