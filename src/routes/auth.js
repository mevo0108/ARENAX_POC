import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authLimiter, authActionLimiter } from '../middleware/rateLimiter.js';

const router = Router();
// POST /api/auth/register - Register a new user
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login - Login user
router.post('/login', authLimiter, authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authActionLimiter, authController.logout);

// DELETE /api/auth/delete - Delete user account 
router.delete('/delete', authActionLimiter, authController.deleteAccount);

export default router;
