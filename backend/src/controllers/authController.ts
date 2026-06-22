import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// In-memory store for verification codes (simple approach for thesis)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// POST /api/auth/send-code — Send verification code to email
export const sendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email is already registered' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store it
    verificationCodes.set(email, { code, expiresAt });

    // Send email
    await sendVerificationEmail(email, code);
    console.log(`📧 Verification code sent to ${email}`);
    res.json({ message: 'Verification code sent to your email' });
  } catch (error: any) {
    console.error('❌ Send code error:', error.message);
    res.status(500).json({ error: 'Failed to send verification code', details: error.message });
  }
};

// POST /api/auth/verify-code — Verify the code (called before registration)
export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    const stored = verificationCodes.get(email);
    if (!stored) return res.status(400).json({ error: 'No verification code found. Please request a new one.' });

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid — remove it
    verificationCodes.delete(email);
    console.log(`✅ Email verified: ${email}`);
    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8); // 8 rounds = ~80ms, still secure
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash: hashedPassword, phoneNumber: phoneNumber || null, role: role || 'CITIZEN' }
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login successful', token, role: user.role, user: { id: user.id, name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong during login.' });
  }
};

// POST /api/auth/test-email
export const testEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Please provide a destination email' });

  const apiKey = process.env.BREVO_API_KEY;
  const systemEmail = process.env.SYSTEM_EMAIL;
  const envStatus = {
    BREVO_API_KEY_set: !!apiKey,
    BREVO_API_KEY_preview: apiKey ? `${apiKey.slice(0, 10)}****` : 'NOT SET',
    SYSTEM_EMAIL_set: !!systemEmail,
    SYSTEM_EMAIL: systemEmail || 'NOT SET',
  };

  try {
    await sendVerificationEmail(email, '123456');
    console.log(`📧 Test email sent successfully to ${email}`);
    res.status(200).json({ message: '✅ Email sent! Check your inbox (and Spam folder).', env: envStatus });
  } catch (error: any) {
    console.error('❌ Brevo Error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message, env: envStatus });
  }
};

// GET /api/auth/profile/:userId
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};

// PATCH /api/auth/profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const { name, email, phoneNumber, pushToken } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (phoneNumber) data.phoneNumber = phoneNumber;
    if (pushToken !== undefined) data.pushToken = pushToken;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({ message: "Profile updated", user: updated });
  } catch (error: any) {
    console.error("❌ Profile update error:", error.message);
    res.status(500).json({ error: "Failed to update profile", details: error.message });
  }
};

// PATCH /api/auth/password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("❌ Password change error:", error.message);
    res.status(500).json({ error: "Failed to change password", details: error.message });
  }
};

// In-memory store for password reset tokens
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// POST /api/auth/forgot-password — Send password reset link to email
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user) return res.json({ message: 'If this email is registered, a reset link has been sent.' });

    // Generate a secure random token
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    resetTokens.set(token, { email, expiresAt });

    // Build reset URL — uses the app's frontend URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mobile/reset-password?token=${token}`;

    await sendPasswordResetEmail(email, user.name, resetUrl);
    console.log(`📧 Password reset link sent to ${email}`);
    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (error: any) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ error: 'Failed to send reset email', details: error.message });
  }
};

// POST /api/auth/reset-password — Apply new password using token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

    const stored = resetTokens.get(token);
    if (!stored) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    if (Date.now() > stored.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: stored.email },
      data: { passwordHash: newHash },
    });

    resetTokens.delete(token); // One-time use
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error: any) {
    console.error('❌ Reset password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
};