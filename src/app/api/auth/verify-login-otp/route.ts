import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginOtp } from '@/utils/verification';

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'User ID and OTP are required' },
        { status: 400 }
      );
    }

    // Verify the login OTP
    const result = await verifyLoginOtp(userId, otp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login OTP verified successfully',
    });

  } catch (error) {
    console.error('Error verifying login OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify login OTP' },
      { status: 500 }
    );
  }
}