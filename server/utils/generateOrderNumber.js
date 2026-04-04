import crypto from 'crypto';
import Order from '../models/Order.js';

/**
 * Daily sequence + random suffix so concurrent POSTs never collide on unique orderNumber.
 */
const generateOrderNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const startOfDay = new Date(y, now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  const seq = String(count + 1).padStart(3, '0');
  const rand = crypto.randomBytes(3).toString('hex');
  return `ORD-${dateStr}-${seq}-${rand}`;
};

export default generateOrderNumber;
