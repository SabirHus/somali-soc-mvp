import { Router } from 'express';
import {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} from '../services/password-reset.service.js';
import { loginRateLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/error-handler.js';

const router = Router();

router.post(
  '/request',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Email is required'
      });
    }

    const result = await requestPasswordReset(email);
    res.json(result);
  })
);

router.post(
  '/reset',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Token and new password are required'
      });
    }

    const result = await resetPassword(token, newPassword);
    res.json(result);
  })
);

router.get(
  '/verify/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await verifyResetToken(token);
    res.json(result);
  })
);

export default router;