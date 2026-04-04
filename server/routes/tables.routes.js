import express from 'express';
import { getTables, createTable, updateTable, updateTableStatus, deleteTable } from '../controllers/tables.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getTables);
router.post('/', createTable);
router.put('/:id', updateTable);
router.patch('/:id/status', updateTableStatus);
router.delete('/:id', deleteTable);

export default router;
