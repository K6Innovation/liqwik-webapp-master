import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/utils/email-service';
import prisma from '@/utils/prisma-client';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, selectedRole } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        email: true,
        isActive: true,
        isFirstLogin: true,
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

    if (!user.isFirstLogin) {
      return NextResponse.json(
        { error: 'Not a first login' },
        { status: 400 }
      );
    }

    // Send first login success email
    try {
      await emailService.sendFirstLoginSuccessEmail(
        email, 
        user.firstName || undefined, 
        selectedRole
      );
      
      console.log(`First login success email sent to ${email}`);
      
      return NextResponse.json({
        message: 'First login success email sent successfully',
        success: true
      }, { status: 200 });
      
    } catch (emailError) {
      console.error('Failed to send first login success email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send first login success email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending first login success email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}