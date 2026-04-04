import Order from '../models/Order.js';

const generateOrderNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  return `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
};

export default generateOrderNumber;
