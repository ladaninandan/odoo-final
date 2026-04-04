import jwt from 'jsonwebtoken';
import RefreshToken from '../../models/RefreshToken.js';
import redisClient from '../../config/redis.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_here';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_here';

export const refreshTokenFlow = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const { id: userId, sessionId } = decoded;

    // Wait, check standard JWT structure.
    if (!sessionId) return res.status(401).json({ message: 'Invalid session structure' });

    // Validate against Redis cache directly for device-level active session
    const activeRedisSession = await redisClient.get(`session:refresh:${userId}:${sessionId}`);
    if (!activeRedisSession || activeRedisSession !== token) {
      return res.status(401).json({ message: 'Session expired or invalidated' });
    }

    // Secondary validation against DB explicitly checking is_revoked (Phase 4.5)
    const validRefreshToken = await RefreshToken.findOne({ token, is_revoked: false });
    if (!validRefreshToken) {
      return res.status(401).json({ message: 'Token revoked globally' });
    }

    // Issue new access token
    const newAccessToken = jwt.sign({ id: userId, sessionId }, JWT_ACCESS_SECRET, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};
