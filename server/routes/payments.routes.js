import express from 'express';
import { initiatePayment, confirmPayment, getUPIQR, getPaymentMethods, updatePaymentMethods } from '../controllers/payments.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/', initiatePayment);
router.patch('/:id/confirm', confirmPayment);
router.get('/upi-qr/:orderId', getUPIQR);
router.get('/methods', getPaymentMethods);
router.put('/methods', authorizeRoles('admin'), updatePaymentMethods);

export default router;
