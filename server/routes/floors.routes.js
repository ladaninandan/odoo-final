import express from 'express';
import { getFloors, createFloor, updateFloor, deleteFloor } from '../controllers/floors.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getFloors);
router.post('/', createFloor);
router.put('/:id', updateFloor);
router.delete('/:id', deleteFloor);

export default router;
