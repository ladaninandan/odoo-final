import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCategories);
router.post('/', authorizeRoles('admin'), createCategory);
router.put('/:id', authorizeRoles('admin'), updateCategory);
router.delete('/:id', authorizeRoles('admin'), deleteCategory);

export default router;
