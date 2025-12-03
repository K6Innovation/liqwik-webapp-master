import { NextRequest, NextResponse } from 'next/server';
import { createLoginOtp } from '@/utils/verification';
import { emailService } from '@/utils/email-service';
import prisma from '@/utils/prisma-client';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Verify user exists and get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      );
    }

    // Generate login OTP
    const otp = await createLoginOtp(userId);

    // Send OTP email
    await emailService.sendLoginOtpEmail(email, otp, user.firstName || undefined);

    return NextResponse.json({
      success: true,
      message: 'Login OTP sent successfully',
    });

  } catch (error) {
    console.error('Error generating login OTP:', error);
    return NextResponse.json(
      { error: 'Failed to generate login OTP' },
      { status: 500 }
    );
  }
}