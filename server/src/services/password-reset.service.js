import { prisma } from '../models/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './email.service.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../middleware/error-handler.js';

export async function requestPasswordReset(email) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      logger.warn('Password reset requested for non-existent email', { email });
      return { success: true, message: 'If an account exists, a reset email will be sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    await sendPasswordResetEmail({
      email: admin.email,
      name: admin.name,
      resetUrl
    });

    logger.info('Password reset email sent', {
      email: admin.email,
      adminId: admin.id
    });

    return {
      success: true,
      message: 'If an account exists, a reset email will be sent'
    };
  } catch (error) {
    logger.error('Password reset request failed', {
      error: error.message,
      email
    });
    throw error;
  }
}

export async function resetPassword(token, newPassword) {
  try {
    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!admin) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    logger.info('Password reset successful', {
      adminId: admin.id,
      email: admin.email
    });

    return {
      success: true,
      message: 'Password reset successful'
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logger.error('Password reset failed', {
      error: error.message
    });
    throw error;
  }
}

export async function verifyResetToken(token) {
  try {
    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!admin) {
      return { valid: false };
    }

    return {
      valid: true,
      admin: {
        email: admin.email,
        name: admin.name
      }
    };
  } catch (error) {
    logger.error('Token verification failed', {
      error: error.message
    });
    throw error;
  }
}