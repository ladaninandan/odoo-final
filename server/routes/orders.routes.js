import express from 'express';
import { getOrders, getOrderById, createOrder, updateOrder, sendToKitchen, updateOrderStatus, cancelOrder } from '../controllers/orders.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.patch('/:id/send-to-kitchen', sendToKitchen);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', cancelOrder);

export default router;
