import { Router } from 'express';
import { register, login, sendCode, verifyCode, testEmail, updateProfile, changePassword } from '../controllers/authController';

const router = Router();

router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/register', register);
router.post('/login', login);
router.post('/test-email', testEmail);
router.patch('/profile', updateProfile);
router.patch('/password', changePassword);

export default router;