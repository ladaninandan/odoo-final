import Order from '../models/Order.js';
import { setOrderKitchenStage } from '../utils/redisCache.js';

const STAGE_FLOW = {
  to_cook: 'preparing',
  preparing: 'completed',
};

export const getActiveKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['sent_to_kitchen', 'ready'] },
    })
      .populate('table', 'tableNumber')
      .sort({ createdAt: 1 });

    // Group by stage
    const grouped = {
      to_cook: [],
      preparing: [],
      completed: [],
    };

    orders.forEach((order) => {
      const orderObj = order.toObject();
      // Determine overall stage by checking items
      const hasUncooked = orderObj.items.some((i) => i.kitchenStatus === 'to_cook');
      const hasPreparing = orderObj.items.some((i) => i.kitchenStatus === 'preparing');
      const allCompleted = orderObj.items.every((i) => i.kitchenStatus === 'completed');

      if (allCompleted) {
        grouped.completed.push(orderObj);
      } else if (hasPreparing) {
        grouped.preparing.push(orderObj);
      } else if (hasUncooked) {
        grouped.to_cook.push(orderObj);
      } else {
        grouped.to_cook.push(orderObj);
      }
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch kitchen orders', error: err.message });
  }
};

export const advanceOrderStage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Advance all non-completed items to the next stage
    let newStage = null;
    order.items.forEach((item) => {
      const next = STAGE_FLOW[item.kitchenStatus];
      if (next) {
        item.kitchenStatus = next;
        newStage = next;
      }
    });

    // If all items are completed, mark order as ready
    const allCompleted = order.items.every((i) => i.kitchenStatus === 'completed');
    if (allCompleted) {
      order.status = 'ready';
    }

    await order.save();
    await setOrderKitchenStage(order._id, newStage || 'completed');

    const io = req.app.get('io');
    io.to('pos').emit('kitchen:stage_update', { orderId: order._id, stage: newStage || 'completed' });
    io.to('customer').emit('order:status_update', { orderId: order._id, status: allCompleted ? 'ready' : newStage });

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: 'Failed to advance order stage', error: err.message });
  }
};

export const markItemPrepared = async (req, res) => {
  try {
    const { itemId } = req.params;
    const order = await Order.findOne({ 'items._id': itemId });
    if (!order) return res.status(404).json({ message: 'Order/item not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.kitchenStatus = 'completed';

    // Check if all items are completed
    const allCompleted = order.items.every((i) => i.kitchenStatus === 'completed');
    if (allCompleted) {
      order.status = 'ready';
    }

    await order.save();

    const io = req.app.get('io');
    io.to('pos').emit('order:item_prepared', { orderId: order._id, itemId });

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: 'Failed to mark item prepared', error: err.message });
  }
};
