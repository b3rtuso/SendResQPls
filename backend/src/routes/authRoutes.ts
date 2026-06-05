import { Router } from 'express';
import { register, login, sendCode, verifyCode, testEmail, getProfile, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/register', register);
router.post('/login', login);
router.post('/test-email', testEmail);
router.get('/profile/:userId', getProfile);
router.patch('/profile', updateProfile);
router.patch('/password', changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;