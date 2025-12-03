import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma-client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user to mark as not first login
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isFirstLogin: false,
      },
      select: {
        id: true,
        isFirstLogin: true,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      isFirstLogin: user.isFirstLogin,
    });

  } catch (error) {
    console.error('Error marking user as not first login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}