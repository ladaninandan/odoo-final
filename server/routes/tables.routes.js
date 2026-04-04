import express from 'express';
import { getTables, createTable, updateTable, updateTableStatus, deleteTable } from '../controllers/tables.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getTables);
router.post('/', authorizeRoles('admin'), createTable);
router.put('/:id', authorizeRoles('admin'), updateTable);
router.patch('/:id/status', updateTableStatus);
router.delete('/:id', authorizeRoles('admin'), deleteTable);

export default router;
