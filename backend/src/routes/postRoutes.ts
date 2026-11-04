import { Router } from 'express';
import {
  getPublicPosts,
  getPostBySlug,
  getPublicTags,
  trackPostView,
  trackPostShare,
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
router.get('/tags', getPublicTags);
router.post('/:slug/view', trackPostView);
router.post('/:slug/share', trackPostShare);
router.get('/:slug', getPostBySlug);

export default router;
