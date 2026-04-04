import express from 'express';
import { generateToken, getMenu, getTableInfo, placeOrder, getOrderStatus } from '../controllers/selfOrder.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Authenticated — cashier generates QR for a table
router.post('/generate-token', protect, generateToken);

// Public — customer uses token to browse menu and order
router.get('/menu', getMenu);
router.get('/table', getTableInfo);
router.post('/place-order', placeOrder);
router.get('/status', getOrderStatus);

export default router;
