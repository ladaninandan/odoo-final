import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import redisClient from '../config/redis.js';

export const protect = async (req, res, next) => {
  let token;

  // Check JWT taking it from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Check if this token is blacklisted in Redis (from a recent logout)
      const isBlacklisted = await redisClient.get(`blacklist:token:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ message: 'Not authorized, token revoked' });
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_here');

      // ABSOLUTE SESSION ENFORCEMENT 
      // If the admin deletes `session:refresh:<id>:<sessionId>` specifically from Redis, instantly bounce them!
      const { id, sessionId } = decoded;
      
      let activeRedisSession;
      if (sessionId) {
        activeRedisSession = await redisClient.get(`session:refresh:${id}:${sessionId}`);
      } else {
        // Fallback for older tokens before device-level sessions
        activeRedisSession = await redisClient.get(`session:refresh:${id}`);
      }
      
      if (!activeRedisSession) {
        return res.status(401).json({ message: 'Redis Session destroyed or expired. Please log in again.' });
      }

      req.user = await User.findById(decoded.id).select('-password_hash');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
