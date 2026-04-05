import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import SelfOrderLink from '../models/SelfOrderLink.js';
import generateSelfOrderToken from '../utils/generateSelfOrderToken.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';

/** Far-future expiry; real validity is `active` on SelfOrderLink (false when table is freed). */
const LINK_EXPIRES_AT = new Date('2099-12-31T23:59:59.000Z');

const INVALID_SELF_ORDER_LINK_MSG =
  'This QR link is no longer valid — the table was cleared. Ask staff for a new QR.';

/** Safe public URL for QR (http/https only). Prefer POS browser origin from client. */
function pickClientBaseUrl(clientOrigin) {
  if (clientOrigin && typeof clientOrigin === 'string') {
    try {
      const u = new URL(clientOrigin.trim());
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return u.origin;
      }
    } catch {
      /* ignore */
    }
  }
  const env = process.env.CLIENT_URL;
  if (env && typeof env === 'string') {
    try {
      const u = new URL(env.trim());
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return u.origin;
      }
    } catch {
      /* ignore */
    }
  }
  return 'http://localhost:3000';
}

export const generateToken = async (req, res) => {
  try {
    const { tableId, sessionId, clientOrigin } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const base = pickClientBaseUrl(clientOrigin);

    const existing = await SelfOrderLink.findOne({
      tableId: table._id,
      $or: [{ active: true }, { active: { $exists: false } }],
    });

    if (existing) {
      if (sessionId) {
        await SelfOrderLink.findByIdAndUpdate(existing._id, { $set: { sessionId } });
      }
      const menuUrl = `${base}/order/${existing.token}`;
      return res.status(200).json({
        token: existing.token,
        menuUrl,
        tableNumber: table.tableNumber,
        reused: true,
      });
    }

    const token = generateSelfOrderToken(tableId, sessionId);

    await SelfOrderLink.findOneAndUpdate(
      { token },
      {
        token,
        tableId,
        sessionId,
        tableNumber: table.tableNumber,
        active: true,
        expiresAt: LINK_EXPIRES_AT,
      },
      { upsert: true }
    );

    const menuUrl = `${base}/order/${token}`;

    res.status(201).json({ token, menuUrl, tableNumber: table.tableNumber, reused: false });
  } catch (err) {
    res.status(400).json({ message: 'Failed to generate self-order token', error: err.message });
  }
};

async function getValidSelfOrderToken(raw) {
  const token = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!token) return null;
  return SelfOrderLink.findOne({
    token,
    $or: [{ active: true }, { active: { $exists: false } }],
  }).lean();
}

export const getMenu = async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: INVALID_SELF_ORDER_LINK_MSG });

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
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: INVALID_SELF_ORDER_LINK_MSG });

    const table = await Table.findById(tokenData.tableId);
    res.json({ table, token: tokenData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch table info', error: err.message });
  }
};

function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

function recalcOrderTotals(orderDoc) {
  let subtotal = 0;
  orderDoc.items.forEach((line) => {
    const lineSub = Number(line.subtotal) || Number(line.quantity) * Number(line.unitPrice);
    line.subtotal = lineSub;
    subtotal += lineSub;
  });
  orderDoc.subtotal = parseFloat(subtotal.toFixed(2));
  orderDoc.tax = parseFloat((subtotal * 5 / 100).toFixed(2));
  orderDoc.total = parseFloat((orderDoc.subtotal + orderDoc.tax).toFixed(2));
}

const ACTIVE_ORDER_STATUSES = ['draft', 'sent_to_kitchen', 'ready'];

export const placeOrder = async (req, res) => {
  try {
    const { items, notes, guestName, guestPhone } = req.body;
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';

    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: INVALID_SELF_ORDER_LINK_MSG });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Add at least one item.' });
    }

    const existing = await Order.findOne({
      table: tokenData.tableId,
      selfOrderToken: token,
      status: { $in: ACTIVE_ORDER_STATUSES },
    }).sort({ createdAt: -1 });

    const nameTrim = typeof guestName === 'string' ? guestName.trim() : '';
    const phoneTrim = typeof guestPhone === 'string' ? guestPhone.trim() : '';

    if (existing) {
      const extraNotes = typeof notes === 'string' ? notes.trim().slice(0, 2000) : '';
      if (extraNotes) {
        const prev = existing.notes || '';
        existing.notes = [prev, extraNotes].filter(Boolean).join('\n—\n').slice(0, 2000);
      }

      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        existing.items.push({
          product: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variant: item.variant || '',
          subtotal: itemSubtotal,
          kitchenStatus: 'to_cook',
        });
      }
      recalcOrderTotals(existing);
      await existing.save();

      const io = req.app.get('io');
      const orderForClients = await Order.findById(existing._id)
        .populate('table', 'tableNumber')
        .populate({
          path: 'items.product',
          select: 'name category',
          populate: { path: 'category', select: 'name' },
        });
      const orderPayload = orderForClients ? orderForClients.toObject() : existing.toObject();
      io.to('pos').emit('order:updated', orderPayload);
      io.to('kitchen').emit('order:updated', orderPayload);
      io.to('customer').emit('customer:set_order', orderPayload);

      return res.status(200).json({
        order: orderForClients || existing,
        message: 'Items added to your order!',
        merged: true,
      });
    }

    if (!nameTrim || nameTrim.length < 2) {
      return res.status(400).json({ message: 'Your name is required (at least 2 characters).' });
    }
    const phoneDigits = digitsOnly(phoneTrim);
    if (phoneDigits.length < 10) {
      return res.status(400).json({ message: 'A valid mobile number is required (at least 10 digits).' });
    }

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
        kitchenStatus: 'to_cook',
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
      status: 'sent_to_kitchen',
      source: 'self_order',
      selfOrderToken: token,
      guestName: nameTrim.slice(0, 120),
      guestPhone: phoneTrim.slice(0, 32),
      notes: typeof notes === 'string' ? notes.trim().slice(0, 2000) : '',
    });

    await Table.findByIdAndUpdate(tokenData.tableId, {
      status: 'occupied',
      currentOrder: order._id,
    });

    const io = req.app.get('io');
    io.to('pos').emit('table:status_update', { tableId: tokenData.tableId, status: 'occupied' });

    const orderForClients = await Order.findById(order._id)
      .populate('table', 'tableNumber')
      .populate({
        path: 'items.product',
        select: 'name category',
        populate: { path: 'category', select: 'name' },
      });

    const orderPayload = orderForClients ? orderForClients.toObject() : order.toObject();
    io.to('pos').emit('order:new', orderPayload);
    io.to('kitchen').emit('order:new', orderPayload);
    io.to('kitchen').emit('order:updated', orderPayload);
    io.to('customer').emit('customer:set_order', orderPayload);
    io.to('customer').emit('order:status_update', {
      orderId: order._id,
      status: 'sent_to_kitchen',
    });

    res.status(201).json({ order: orderForClients || order, message: 'Order placed successfully!', merged: false });
  } catch (err) {
    res.status(400).json({ message: 'Failed to place order', error: err.message });
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    const tokenData = await getValidSelfOrderToken(token);
    if (!tokenData) return res.status(401).json({ message: INVALID_SELF_ORDER_LINK_MSG });

    const order = await Order.findOne({
      table: tokenData.tableId,
      selfOrderToken: token,
    })
      .populate('table', 'tableNumber')
      .sort({ createdAt: -1 });

    if (!order) return res.status(404).json({ message: 'No order found' });

    const tableNumber = order.table?.tableNumber ?? null;

    res.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      guestName: order.guestName || '',
      guestPhone: order.guestPhone || '',
      notes: order.notes || '',
      tableNumber,
      createdAt: order.createdAt ? order.createdAt.toISOString() : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order status', error: err.message });
  }
};
