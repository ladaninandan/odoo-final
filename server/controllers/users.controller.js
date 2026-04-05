import User from '../models/User.js';

export const listUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('first_name last_name email phone role status created_at')
      .sort({ created_at: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    if (req.user._id.toString() === id && role && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    const updates = {};
    if (role !== undefined) {
      if (!['admin', 'cashier', 'kitchen'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      updates.role = role;
    }
    if (status !== undefined) {
      if (!['active', 'suspended', 'archived'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = status;
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select(
      '-password_hash -password'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update user', error: err.message });
  }
};
