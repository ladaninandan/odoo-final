import jwt from 'jsonwebtoken';
import RefreshToken from '../../models/RefreshToken.js';
import UserSession from '../../models/UserSession.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_here';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_here';

export const refreshTokenFlow = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const { id: userId, sessionId } = decoded;

    if (!sessionId) return res.status(401).json({ message: 'Invalid session structure' });

    const validRefreshToken = await RefreshToken.findOne({ token, is_revoked: false });
    if (!validRefreshToken) {
      return res.status(401).json({ message: 'Token revoked globally' });
    }

    const userSession = await UserSession.findOne({
      _id: sessionId,
      user_id: userId,
      is_active: true,
    });
    if (!userSession || userSession.token !== token) {
      return res.status(401).json({ message: 'Session expired or invalidated' });
    }

    const newAccessToken = jwt.sign({ id: userId, sessionId }, JWT_ACCESS_SECRET, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};
