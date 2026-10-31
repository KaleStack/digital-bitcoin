import { Router } from 'express';
import { login, getMe, updateProfile, logout, loginSchema, updateProfileSchema } from '../controllers/authController.js';
import { authGuard } from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authGuard, getMe);
router.put('/profile', authGuard, validate(updateProfileSchema), updateProfile);

export default router;
