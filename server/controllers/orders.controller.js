import Order from '../models/Order.js';
import Table from '../models/Table.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import { releaseTableForOrder, allKitchenItemsComplete } from '../utils/releaseTable.js';

export const getOrders = async (req, res) => {
  try {
    const { status, table, session, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (table) filter.table = table;
    if (session) filter.session = session;

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber floor')
      .populate('createdBy', 'first_name last_name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'tableNumber floor')
      .populate('createdBy', 'first_name last_name')
      .populate('items.product', 'name price image');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { tableId, sessionId, items, notes, source = 'pos', selfOrderToken = '' } = req.body;

    const orderNumber = await generateOrderNumber();

    // Calculate totals
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

    const taxRate = 5; // default
    const tax = parseFloat((subtotal * taxRate / 100).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = await Order.create({
      orderNumber,
      session: sessionId,
      table: tableId,
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
    await Table.findByIdAndUpdate(tableId, {
      status: 'occupied',
      currentOrder: order._id,
    });

    const io = req.app.get('io');
    io.to('pos').emit('table:status_update', { tableId: String(tableId), status: 'occupied' });

    const populated = await order.populate('table', 'tableNumber floor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create order', error: err.message });
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
        return {
          product: item.productId || item.product,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variant: item.variant || '',
          subtotal: itemSubtotal,
          kitchenStatus: item.kitchenStatus || 'pending',
        };
      });
      const tax = parseFloat((subtotal * 5 / 100).toFixed(2));
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = parseFloat((subtotal + tax).toFixed(2));
    }
    if (notes !== undefined) order.notes = notes;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update order', error: err.message });
  }
};

export const sendToKitchen = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('table', 'tableNumber');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'sent_to_kitchen';
    order.items.forEach((item) => {
      if (item.kitchenStatus === 'pending') {
        item.kitchenStatus = 'to_cook';
      }
    });
    await order.save();

    // Emit to Kitchen Display + Customer Display (full order for second screen)
    const io = req.app.get('io');
    const orderPayload = order.toObject();
    io.to('kitchen').emit('order:new', orderPayload);
    io.to('customer').emit('customer:set_order', orderPayload);
    io.to('customer').emit('order:status_update', {
      orderId: order._id,
      status: 'sent_to_kitchen',
    });

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: 'Failed to send order to kitchen', error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    if (status === 'cancelled' && order.table) {
      await releaseTableForOrder(order, io);
    } else if (status === 'paid' && order.table && allKitchenItemsComplete(order)) {
      await releaseTableForOrder(order, io);
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update order status', error: err.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });

    const io = req.app.get('io');
    io.to('pos').emit('table:status_update', { tableId: String(order.table), status: 'available' });

    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order', error: err.message });
  }
};
