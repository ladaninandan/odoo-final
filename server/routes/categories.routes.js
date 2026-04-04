import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
