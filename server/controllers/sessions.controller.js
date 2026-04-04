import Session from '../models/Session.js';
import { setActiveSession, getActiveSession, clearActiveSession } from '../utils/redisCache.js';

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('openedBy', 'first_name last_name')
      .sort({ openedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: err.message });
  }
};

export const getCurrentSession = async (req, res) => {
  try {
    // Check Redis first
    const cached = await getActiveSession(req.user._id);
    if (cached) {
      return res.json(cached);
    }

    // Fallback to MongoDB
    const session = await Session.findOne({ openedBy: req.user._id, status: 'open' })
      .populate('openedBy', 'first_name last_name');

    if (session) {
      await setActiveSession(req.user._id, session.toObject());
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current session', error: err.message });
  }
};

export const openSession = async (req, res) => {
  try {
    // Check if user already has an open session
    const existing = await Session.findOne({ openedBy: req.user._id, status: 'open' });
    if (existing) {
      return res.status(400).json({ message: 'You already have an open session' });
    }

    const { openingBalance } = req.body;
    const session = await Session.create({
      openedBy: req.user._id,
      openingBalance: openingBalance || 0,
    });

    const populated = await session.populate('openedBy', 'first_name last_name');
    await setActiveSession(req.user._id, populated.toObject());

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to open session', error: err.message });
  }
};

export const closeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'closed') {
      return res.status(400).json({ message: 'Session is already closed' });
    }

    const { closingBalance } = req.body;
    session.status = 'closed';
    session.closedAt = new Date();
    session.closingBalance = closingBalance || 0;
    await session.save();

    await clearActiveSession(session.openedBy);

    // Notify all POS clients
    const io = req.app.get('io');
    io.to('pos').emit('session:closed', { sessionId: session._id });

    res.json(session);
  } catch (err) {
    res.status(400).json({ message: 'Failed to close session', error: err.message });
  }
};
