import UserSession from '../../models/UserSession.js';
import RefreshToken from '../../models/RefreshToken.js';
import AccessTokenBlacklist from '../../models/AccessTokenBlacklist.js';
import jwt from 'jsonwebtoken';

export const logoutUser = async (req, res) => {
  let userId = req.user ? req.user._id : null;

  let sessionId = null;
  if (!userId && req.cookies && req.cookies.jwt) {
    try {
      const decoded = jwt.decode(req.cookies.jwt);
      if (decoded && decoded.id) {
        userId = decoded.id;
        sessionId = decoded.sessionId || null;
      }
    } catch (e) { }
  } else if (req.user) {
    const decoded = jwt.decode(req.headers.authorization.split(' ')[1]);
    if (decoded && decoded.sessionId) {
      sessionId = decoded.sessionId;
    }
  }

  const refreshFromCookie = req.cookies?.jwt;
  if (refreshFromCookie) {
    await RefreshToken.updateOne({ token: refreshFromCookie }, { $set: { is_revoked: true } });
  }

  if (userId) {
    if (sessionId) {
      await UserSession.updateOne({ _id: sessionId }, { $set: { is_active: false, logout_time: new Date() } });
    } else {
      await UserSession.updateMany(
        { user_id: userId, is_active: true },
        { $set: { is_active: false, logout_time: new Date() } }
      );
    }
  }

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await AccessTokenBlacklist.findOneAndUpdate(
            { token },
            { token, expiresAt: new Date(decoded.exp * 1000) },
            { upsert: true }
          );
        }
      }
    } catch (e) { }
  }

  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: 'User logged out' });
};
