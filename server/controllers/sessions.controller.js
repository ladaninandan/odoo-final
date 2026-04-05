import Session from '../models/Session.js';
import Order from '../models/Order.js';

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
    const session = await Session.findOne({ openedBy: req.user._id, status: 'open' })
      .populate('openedBy', 'first_name last_name');

    if (!session) {
      return res.json(null);
    }

    const pendingOrdersCount = await Order.countDocuments({
      session: session._id,
      status: { $nin: ['paid', 'cancelled'] },
    });

    const obj = session.toObject();
    res.json({
      ...obj,
      pendingOrdersCount,
      canCloseSession: pendingOrdersCount === 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current session', error: err.message });
  }
};

export const openSession = async (req, res) => {
  try {
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
    const obj = populated.toObject();
    res.status(201).json({
      ...obj,
      pendingOrdersCount: 0,
      canCloseSession: true,
    });
  } catch (err) {
    res.status(400).json({ message: 'Failed to open session', error: err.message });
  }
};

export const closeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const isOwner = session.openedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only close your own session' });
    }
    if (session.status === 'closed') {
      return res.status(400).json({ message: 'Session is already closed' });
    }

    const pendingOrders = await Order.countDocuments({
      session: session._id,
      status: { $nin: ['paid', 'cancelled'] },
    });
    if (pendingOrders > 0) {
      return res.status(409).json({
        message:
          'Cannot close this session while orders are still open. Complete payment for every order (or cancel them) before closing the till.',
      });
    }

    const { closingBalance } = req.body;
    session.status = 'closed';
    session.closedAt = new Date();
    session.closingBalance = closingBalance || 0;
    await session.save();

    const io = req.app.get('io');
    io.to('pos').emit('session:closed', { sessionId: session._id });

    res.json(session);
  } catch (err) {
    res.status(400).json({ message: 'Failed to close session', error: err.message });
  }
};
