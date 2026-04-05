import express from 'express';
import { getFloors, createFloor, updateFloor, deleteFloor } from '../controllers/floors.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getFloors);
router.post('/', authorizeRoles('admin'), createFloor);
router.put('/:id', authorizeRoles('admin'), updateFloor);
router.delete('/:id', authorizeRoles('admin'), deleteFloor);

export default router;
