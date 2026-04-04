import UserSession from '../../models/UserSession.js';
import redisClient from '../../config/redis.js';
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
    // If router had auth middleware
    const decoded = jwt.decode(req.headers.authorization.split(' ')[1]);
    if (decoded && decoded.sessionId) {
      sessionId = decoded.sessionId;
    }
  }

  // Invalidate Refresh Token in Redis and MongoDB!
  if (userId) {
    if (sessionId) {
      // Device-level logout
      await redisClient.del(`session:refresh:${userId}:${sessionId}`);
      await UserSession.updateOne({ _id: sessionId }, { $set: { is_active: false, logout_time: new Date() } });
    } else {
      // Global fallback logout (could delete all device keys by pattern matching, or rely on token refresh failing)
      await UserSession.updateMany(
        { user_id: userId, is_active: true },
        { $set: { is_active: false, logout_time: new Date() } }
      );
    }
  }

  // Blacklist access token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    // Decode to find expiration
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redisClient.set(`blacklist:token:${token}`, 'invalidated', 'EX', ttl);
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
