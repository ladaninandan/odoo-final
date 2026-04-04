import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import SelfOrderLink from '../models/SelfOrderLink.js';
import generateSelfOrderToken from '../utils/generateSelfOrderToken.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';

const TOKEN_TTL = 8 * 60 * 60; // 8 hours

export const generateToken = async (req, res) => {
  try {
    const { tableId, sessionId } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const token = generateSelfOrderToken(tableId, sessionId);

    await SelfOrderLink.findOneAndUpdate(
      { token },
      {
        token,
        tableId,
        sessionId,
        tableNumber: table.tableNumber,
        expiresAt: new Date(Date.now() + TOKEN_TTL * 1000),
      },
      { upsert: true }
    );

    const menuUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/order/${token}`;

    res.status(201).json({ token, menuUrl, tableNumber: table.tableNumber });
  } catch (err) {
    res.status(400).json({ message: 'Failed to generate self-order token', error: err.message });
  }
};

async function getValidSelfOrderToken(token) {
  return SelfOrderLink.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean();
}

export const getMenu = async (req, res) => {
  try {
    const { token } = req.query;

    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: 'Invalid or expired token' });

    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).populate('category', 'name color icon').sort({ name: 1 }),
      Category.find().sort({ name: 1 }),
    ]);

    res.json({ products, categories, tableNumber: tokenData.tableNumber });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch menu', error: err.message });
  }
};

export const getTableInfo = async (req, res) => {
  try {
    const { token } = req.query;
    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: 'Invalid or expired token' });

    const table = await Table.findById(tokenData.tableId);
    res.json({ table, token: tokenData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch table info', error: err.message });
  }
};

export const placeOrder = async (req, res) => {
  try {
    const { token, items, notes } = req.body;

    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: 'Invalid or expired token' });

    const orderNumber = await generateOrderNumber();

    let subtotal = 0;
    const orderItems = items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      return {
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variant: item.variant || '',
        subtotal: itemSubtotal,
        kitchenStatus: 'pending',
      };
    });

    const tax = parseFloat((subtotal * 5 / 100).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = await Order.create({
      orderNumber,
      session: tokenData.sessionId,
      table: tokenData.tableId,
      items: orderItems,
      subtotal,
      tax,
      total,
      status: 'draft',
      source: 'self_order',
      selfOrderToken: token,
      notes: notes || '',
    });

    await Table.findByIdAndUpdate(tokenData.tableId, {
      status: 'occupied',
      currentOrder: order._id,
    });

    const io = req.app.get('io');
    io.to('pos').emit('table:status_update', { tableId: tokenData.tableId, status: 'occupied' });
    io.to('pos').emit('order:new', order.toObject());

    res.status(201).json({ order, message: 'Order placed successfully!' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to place order', error: err.message });
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const { token } = req.query;
    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: 'Invalid or expired token' });

    const order = await Order.findOne({
      table: tokenData.tableId,
      selfOrderToken: token,
    }).sort({ createdAt: -1 });

    if (!order) return res.status(404).json({ message: 'No order found' });

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      total: order.total,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order status', error: err.message });
  }
};
