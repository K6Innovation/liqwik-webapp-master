// src/app/api/notifications/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/utils/notification-service";
import CustomError from "@/utils/custom-error";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role'); // Get role filter from query params

    // Fetch notifications filtered by role
    const notifications = await NotificationService.getUserNotifications(
      userId, 
      limit, 
      role
    );
    
    // Get unread count filtered by role
    const unreadCount = await NotificationService.getUnreadCount(userId, role);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Failed to get notifications:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const body = await req.json();
    const { action, notificationId, role } = body;

    if (action === 'markAsRead' && notificationId) {
      const notification = await NotificationService.markAsRead(notificationId);
      return NextResponse.json(notification);
    }

    if (action === 'markAllAsRead') {
      // Pass role to markAllAsRead so it only marks notifications for current role
      const result = await NotificationService.markAllAsRead(userId, role);
      return NextResponse.json(result);
    }

    throw new CustomError("Invalid action", 400);
  } catch (error: any) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}