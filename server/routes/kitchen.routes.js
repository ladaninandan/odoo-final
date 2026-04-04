import express from 'express';
import { getActiveKitchenOrders, advanceOrderStage, markItemPrepared } from '../controllers/kitchen.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/orders', getActiveKitchenOrders);
router.patch('/orders/:id/stage', advanceOrderStage);
router.patch('/items/:itemId/prepared', markItemPrepared);

export default router;
