import User from '../../models/User.js';
import UserSession from '../../models/UserSession.js';
import redisClient from '../../config/redis.js';
import supabase from '../../config/supabase.js';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { generateTokens } from './authUtils.js';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

export const googleLogin = async (req, res) => {
  const { code, tokenId } = req.body;
  try {
    let payload;

    if (code) {
      // Using auth-code flow with client secret
      const { tokens } = await googleClient.getToken(code);
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else if (tokenId) {
      // Legacy implicit flow (fallback)
      const ticket = await googleClient.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else {
      return res.status(400).json({ message: 'No Google credential provided' });
    }

    const { email, name, sub, given_name, family_name, email_verified, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      const splitName = name ? name.split(' ') : ['User'];
      user = await User.create({
        first_name: splitName[0],
        last_name: splitName.slice(1).join(' ') || '',
        name,
        email,
        authProvider: 'google',
        googleId: sub
      });
    }

    // 🔄 Sync with Supabase asynchronously (non-blocking)
    Promise.resolve().then(async () => {
      try {
        const { error: supabaseError } = await supabase
          .from('users')
          .upsert([{
            sub: sub,
            name: name,
            given_name: given_name || '',
            family_name: family_name || '',
            email: email,
            email_verified: email_verified || false,
            picture: picture || '',
            mongodb_id: user._id.toString(),
            auth_provider: 'google'
          }], { onConflict: 'sub' });

        if (supabaseError) {
          console.error('Supabase Upsert Error:', supabaseError);
        }
      } catch (e) {
        console.error('Supabase Connection Error:', e);
      }
    });

    const sessionId = new mongoose.Types.ObjectId();
    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);
    await redisClient.set(`session:refresh:${user._id}:${sessionId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    
    await UserSession.create({
      _id: sessionId,
      user_id: user._id,
      token: refreshToken,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      user_agent: req.headers['user-agent'] || ''
    });

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name || user.first_name,
      first_name: user.first_name,
      last_name: user.last_name || '',
      email: user.email,
      role: user.role,
      accessToken,
    });

  } catch (error) {
    res.status(401).json({ message: 'Google Auth failed', error: error.message });
  }
};
