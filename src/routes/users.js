import express from 'express';
import userController from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', auth, userController.getProfile);
router.patch('/profile', auth, userController.updateProfile);
router.get('/games', auth, userController.getGameHistory);

export default router;
