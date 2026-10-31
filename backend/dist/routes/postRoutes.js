import { Router } from 'express';
import { getPublicPosts, getPostBySlug } from '../controllers/postController.js';
const router = Router();
// Public endpoints
router.get('/', getPublicPosts);
router.get('/:slug', getPostBySlug);
export default router;
