import Payment from '../models/Payment.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Order from '../models/Order.js';
import Session from '../models/Session.js';
import generateUPIQR from '../utils/generateQR.js';
import { releaseTableForOrder } from '../utils/releaseTable.js';

export const initiatePayment = async (req, res) => {
  try {
    const { orderId, method, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let upiId = '';
    let qrCode = '';

    if (method === 'upi') {
      const upiMethod = await PaymentMethod.findOne({ type: 'upi', isEnabled: true });
      upiId = upiMethod?.upiId || process.env.DEFAULT_UPI_ID || 'cafe@ybl.com';
      qrCode = await generateUPIQR(upiId, amount, order.orderNumber);
    }

    const payment = await Payment.create({
      order: orderId,
      session: order.session,
      method,
      amount,
      upiId,
      qrCode,
      status: 'pending',
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: 'Failed to initiate payment', error: err.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', confirmedAt: new Date() },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const order = await Order.findByIdAndUpdate(payment.order, { status: 'paid' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update session total sales
    if (payment.session) {
      await Session.findByIdAndUpdate(payment.session, {
        $inc: { totalSales: payment.amount },
      });
    }

    const io = req.app.get('io');
    io.to('pos').emit('payment:confirmed', { orderId: payment.order, paymentId: payment._id });
    io.to('customer').emit('payment:confirmed', { orderId: payment.order });

    // POS flow: table frees when payment is taken (kitchen may still be in progress)
    if (order.table) {
      await releaseTableForOrder(order, io);
    }

    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: 'Failed to confirm payment', error: err.message });
  }
};

export const getUPIQR = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const upiMethod = await PaymentMethod.findOne({ type: 'upi', isEnabled: true });
    const upiId = upiMethod?.upiId || process.env.DEFAULT_UPI_ID || 'cafe@ybl.com';
    const qrCode = await generateUPIQR(upiId, order.total, order.orderNumber);

    res.json({ qrCode, upiId, amount: order.total, orderNumber: order.orderNumber });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate UPI QR', error: err.message });
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find();
    res.json(methods);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment methods', error: err.message });
  }
};

export const updatePaymentMethods = async (req, res) => {
  try {
    const { methods } = req.body; // Array of { type, isEnabled, upiId }
    const results = await Promise.all(
      methods.map((m) =>
        PaymentMethod.findOneAndUpdate(
          { type: m.type },
          { isEnabled: m.isEnabled, upiId: m.upiId || '' },
          { upsert: true, new: true }
        )
      )
    );
    res.json(results);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update payment methods', error: err.message });
  }
};
