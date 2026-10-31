import { Router } from 'express';
import {
  getPublicPosts,
  getPostBySlug,
  getAdminPosts,
  getAdminStats,
  createPost,
  updatePost,
  deletePost,
  postSchema
} from '../controllers/postController.js';
import { authGuard } from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public endpoints
router.get('/', getPublicPosts);
router.get('/:slug', getPostBySlug);

export default router;
