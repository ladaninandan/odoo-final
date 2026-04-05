import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Customer from '../models/Customer.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import { orderReadyForPayment, releaseTableForOrder } from '../utils/releaseTable.js';
import { populateOrderDetail } from '../utils/populateOrder.js';

/** Normalize id from JSON (string or { _id }) */
function idString(id) {
  if (id == null) return '';
  if (typeof id === 'object' && id !== null && id._id != null) return String(id._id);
  return String(id);
}

/** Stricter than Types.ObjectId.isValid (avoids false positives on some inputs) */
function isValidObjectId(id) {
  const s = idString(id);
  return Boolean(s && mongoose.isValidObjectId(s));
}

export const getOrders = async (req, res) => {
  try {
    const { status, table, session, limit = '50' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (table) filter.table = table;
    if (session) filter.session = session;

    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 1000);

    const orders = await populateOrderDetail(Order.find(filter))
      .sort({ createdAt: -1 })
      .limit(lim);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await populateOrderDetail(Order.findById(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      tableId,
      sessionId,
      customerId,
      customer: customerAlt,
      items,
      notes,
      source = 'pos',
      selfOrderToken = '',
    } = req.body;

    const resolvedCustomerId = idString(customerId || customerAlt);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one line item' });
    }

    if (!tableId || !isValidObjectId(tableId)) {
      return res.status(400).json({ message: 'Valid tableId is required' });
    }

    if (source === 'pos' && !resolvedCustomerId) {
      return res.status(400).json({ message: 'Customer is required for POS orders' });
    }
    if (resolvedCustomerId) {
      if (!isValidObjectId(resolvedCustomerId)) {
        return res.status(400).json({ message: 'Invalid customer id' });
      }
      const exists = await Customer.findById(resolvedCustomerId);
      if (!exists) return res.status(400).json({ message: 'Invalid customer' });
    }

    const orderNumber = await generateOrderNumber();

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const pid = item.productId ?? item.product;
      if (!pid || !isValidObjectId(pid)) {
        return res.status(400).json({
          message: 'Each line item must include a valid productId',
        });
      }
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isFinite(unitPrice)) {
        return res.status(400).json({ message: 'Invalid quantity or unitPrice on line item' });
      }
      const itemSubtotal = qty * unitPrice;
      subtotal += itemSubtotal;
      orderItems.push({
        product: idString(pid),
        name: String(item.name || 'Item'),
        quantity: qty,
        unitPrice,
        variant: item.variant || '',
        subtotal: itemSubtotal,
        kitchenStatus: 'pending',
      });
    }

    const taxRate = 5; // default
    const tax = parseFloat((subtotal * taxRate / 100).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const sessionOid = sessionId && isValidObjectId(sessionId) ? idString(sessionId) : null;

    const order = await Order.create({
      orderNumber,
      session: sessionOid || undefined,
      customer: resolvedCustomerId || null,
      table: idString(tableId),
      createdBy: req.user?._id || null,
      items: orderItems,
      subtotal,
      tax,
      total,
      status: 'draft',
      source,
      selfOrderToken,
      notes: notes || '',
    });

    // Mark table as occupied
    await Table.findByIdAndUpdate(idString(tableId), {
      status: 'occupied',
      currentOrder: order._id,
    });

    const io = req.app.get('io');
    io.to('pos').emit('table:status_update', { tableId: String(tableId), status: 'occupied' });

    const populated = await order.populate([
      { path: 'table', select: 'tableNumber floor' },
      { path: 'customer', select: 'name phone mobile email address city state country' },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    console.error('createOrder', err?.name, err?.code, err?.message);
    if (err?.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Order validation failed',
        error: err.message,
        details: err.errors,
      });
    }
    if (err?.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate order number — please try again',
        error: err.message,
      });
    }
    res.status(400).json({
      message: err?.message || 'Failed to create order',
      error: err?.message,
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { items, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'paid' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update a paid or cancelled order' });
    }

    if (items) {
      let subtotal = 0;
      order.items = items.map((item) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        subtotal += itemSubtotal;
        const row = {
          product: item.productId || item.product,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variant: item.variant || '',
          subtotal: itemSubtotal,
          kitchenStatus: item.kitchenStatus || 'pending',
        };
        const lineId = item.orderLineId ?? item._id;
        if (lineId && isValidObjectId(lineId)) {
          row._id = lineId;
        }
        return row;
      });
      const tax = parseFloat((subtotal * 5 / 100).toFixed(2));
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = parseFloat((subtotal + tax).toFixed(2));
    }
    if (notes !== undefined) order.notes = notes;

    await order.save();
    const out = await populateOrderDetail(Order.findById(order._id));
    res.json(out);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update order', error: err.message });
  }
};

export const sendToKitchen = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'sent_to_kitchen';
    order.items.forEach((item) => {
      if (item.kitchenStatus === 'pending') {
        item.kitchenStatus = 'to_cook';
      }
    });
    await order.save();

    const populated = await populateOrderDetail(Order.findById(order._id));
    const orderPayload = populated.toObject();

    // Emit to Kitchen Display + Customer Display (same shape as GET /orders/:id)
    const io = req.app.get('io');
    io.to('kitchen').emit('order:new', orderPayload);
    io.to('kitchen').emit('order:updated', orderPayload);
    io.to('customer').emit('customer:set_order', orderPayload);
    io.to('customer').emit('order:status_update', {
      orderId: order._id,
      status: 'sent_to_kitchen',
    });

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to send order to kitchen', error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Order not found' });

    if (status === 'paid' && !orderReadyForPayment(existing)) {
      return res.status(400).json({
        message: 'Cannot mark as paid until every item is completed in the kitchen.',
      });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    if (status === 'cancelled' && order.table) {
      await releaseTableForOrder(order, io);
    } else if (status === 'paid' && order.table) {
      await releaseTableForOrder(order, io);
    }

    const out = await populateOrderDetail(Order.findById(order._id));
    res.json(out);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update order status', error: err.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    if (order.table) {
      await releaseTableForOrder(order, io);
    }

    const populated = await populateOrderDetail(Order.findById(order._id));
    res.json({ message: 'Order cancelled', order: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order', error: err.message });
  }
};
