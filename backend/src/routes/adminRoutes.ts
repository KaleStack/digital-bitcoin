import { Router } from 'express';
import {
  getAdminPosts,
  getAdminStats,
  createPost,
  updatePost,
  deletePost,
  postSchema
} from '../controllers/postController.js';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  categorySchema
} from '../controllers/categoryController.js';
import { uploadImage } from '../controllers/uploadController.js';
import { authGuard } from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Protect all admin routes
router.use(authGuard);

// Stats
router.get('/stats', getAdminStats);

// Posts CRUD
router.get('/posts', getAdminPosts);
router.post('/posts', validate(postSchema), createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Categories CRUD
router.post('/categories', validate(categorySchema), createCategory);
router.put('/categories/:id', validate(categorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Media Upload
router.post('/upload', upload.single('image'), uploadImage);

export default router;
