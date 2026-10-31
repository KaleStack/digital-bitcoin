import { Router } from 'express';
import { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, categorySchema } from '../controllers/categoryController.js';
import { authGuard } from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';
const router = Router();
// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
// Protected admin routes
router.post('/admin', authGuard, validate(categorySchema), createCategory);
router.put('/admin/:id', authGuard, validate(categorySchema), updateCategory);
router.delete('/admin/:id', authGuard, deleteCategory);
export default router;
