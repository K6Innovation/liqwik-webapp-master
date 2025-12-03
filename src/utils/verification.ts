import crypto from 'crypto';
import prisma from './prisma-client';

export function generateVerificationCode(): string {
  // Generate a 6-digit numeric code
  return crypto.randomInt(100000, 999999).toString();
}

export async function createVerificationCode(
  userId: string,
  email: string
): Promise<string> {
  const code = generateVerificationCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Code expires in 1 hour

  // Update user with verification code
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationCode: code,
      verificationCodeExpireDate: expiresAt,
    },
  });

  return code;
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      verificationCode: true,
      verificationCodeExpireDate: true,
      isEmailVerified: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  if (user.isEmailVerified) {
    return {
      success: false,
      error: 'Email is already verified',
    };
  }

  if (!user.verificationCode || user.verificationCode !== code) {
    return {
      success: false,
      error: 'Invalid verification code',
    };
  }

  if (!user.verificationCodeExpireDate || user.verificationCodeExpireDate <= new Date()) {
    return {
      success: false,
      error: 'Verification code has expired',
    };
  }

  // Mark the code as used by clearing it and marking email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      verificationCode: null,
      verificationCodeExpireDate: null,
    },
  });

  return {
    success: true,
    userId: user.id,
  };
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isEmailVerified: true },
  });

  return user?.isEmailVerified ?? false;
}

export async function markEmailAsVerified(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      verificationCode: null,
      verificationCodeExpireDate: null,
    },
  });
}

export async function resendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
       id: true,
       isEmailVerified: true,
       firstName: true,
      verificationCodeExpireDate: true
    },
  });

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  if (user.isEmailVerified) {
    return {
      success: false,
      error: 'Email is already verified',
    };
  }

  // Check if we can resend (prevent spam)
  if (user.verificationCodeExpireDate) {
    const now = new Date();
    const timeSinceLastCode = now.getTime() - (user.verificationCodeExpireDate.getTime() - (60 * 60 * 1000)); // Subtract 1 hour from expire time
    const minTimeBetweenResends = 60 * 1000; // 1 minute minimum between resends

    if (timeSinceLastCode < minTimeBetweenResends) {
      return {
        success: false,
        error: 'Please wait before requesting another verification code',
      };
    }
  }

  try {
    await createVerificationCode(user.id, email);
        
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error resending verification code:', error);
    return {
      success: false,
      error: 'Failed to generate new verification code',
    };
  }
}

// New functions for login OTP
export function generateLoginOtp(): string {
  // Generate a 6-digit numeric code
  return crypto.randomInt(100000, 999999).toString();
}

export async function createLoginOtp(userId: string): Promise<string> {
  const code = generateLoginOtp();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

  // Update user with login OTP code
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginOtpCode: code,
      loginOtpCodeExpireDate: expiresAt,
    },
  });

  return code;
}

export async function verifyLoginOtp(
  userId: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      loginOtpCode: true,
      loginOtpCodeExpireDate: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      error: 'User not found or inactive',
    };
  }

  if (!user.loginOtpCode || user.loginOtpCode !== otp) {
    return {
      success: false,
      error: 'Invalid OTP code',
    };
  }

  if (!user.loginOtpCodeExpireDate || user.loginOtpCodeExpireDate <= new Date()) {
    return {
      success: false,
      error: 'OTP code has expired',
    };
  }

  // Clear the OTP after successful verification
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginOtpCode: null,
      loginOtpCodeExpireDate: null,
    },
  });

  return {
    success: true,
  };
}

export async function clearLoginOtp(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginOtpCode: null,
      loginOtpCodeExpireDate: null,
    },
  });
}