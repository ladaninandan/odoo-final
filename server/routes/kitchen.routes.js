import express from 'express';
import { getActiveKitchenOrders, advanceOrderStage, markItemPrepared } from '../controllers/kitchen.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'kitchen'));

router.get('/orders', getActiveKitchenOrders);
router.patch('/orders/:id/stage', advanceOrderStage);
router.patch('/items/:itemId/prepared', markItemPrepared);

export default router;
