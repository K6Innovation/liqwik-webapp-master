// src/utils/notification-service.ts

import prisma from "@/utils/prisma-client";

export enum NotificationType {
  ASSET_CREATED = "ASSET_CREATED",
  BID_RECEIVED = "BID_RECEIVED", 
  BID_ACCEPTED = "BID_ACCEPTED",
  BID_REJECTED = "BID_REJECTED",
  ASSET_UPDATED = "ASSET_UPDATED",
  BID_SAVED = "BID_SAVED",
  PAYMENT_MADE = "PAYMENT_MADE",
  FEE_APPROVED = "FEE_APPROVED",
  BILL_TO_PARTY_VALIDATED = "BILL_TO_PARTY_VALIDATED",
  ASSET_POSTED = "ASSET_POSTED",
  ASSET_CANCELLED = "ASSET_CANCELLED",
  PAYMENT_OVERDUE = "PAYMENT_OVERDUE"
}

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  assetId?: string;
  bidId?: string;
  metadata?: any;
  roleContext?: string;
}

export class NotificationService {
  // Create a single notification
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          assetId: data.assetId,
          bidId: data.bidId,
          metadata: data.metadata,
          roleContext: data.roleContext,
        },
      });
      return notification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  // Create notifications for multiple users
  static async createMultipleNotifications(notifications: NotificationData[]) {
    try {
      const createdNotifications = await prisma.notification.createMany({
        data: notifications.map(notification => ({
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          assetId: notification.assetId,
          bidId: notification.bidId,
          metadata: notification.metadata,
          roleContext: notification.roleContext,
        })),
      });
      return createdNotifications;
    } catch (error) {
      console.error("Failed to create multiple notifications:", error);
      throw error;
    }
  }

  // Get notifications for a user filtered by role
  static async getUserNotifications(userId: string, limit: number = 50, role: string | null) {
    try {
      const whereClause: any = {
        userId: userId,
      };

      // Filter by role context if role is provided
      if (role) {
        whereClause.roleContext = role;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
      return notifications;
    } catch (error) {
      console.error("Failed to get user notifications:", error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return notification;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for a user and specific role
  static async markAllAsRead(userId: string, role: string | null) {
    try {
      const whereClause: any = {
        userId: userId,
        isRead: false,
      };

      // Only mark notifications for the current role
      if (role) {
        whereClause.roleContext = role;
      }

      const result = await prisma.notification.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  }

  // Get unread count for a user filtered by role
  static async getUnreadCount(userId: string, role: string | null) {
    try {
      const whereClause: any = {
        userId: userId,
        isRead: false,
      };

      // Filter by role context if role is provided
      if (role) {
        whereClause.roleContext = role;
      }

      const count = await prisma.notification.count({
        where: whereClause,
      });
      return count;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      throw error;
    }
  }

  // Notification creators for specific scenarios
  static async notifyAssetCreated(
    sellerUserId: string, 
    asset: any, 
    billToPartyName: string
  ) {
    const notification = {
      userId: sellerUserId,
      type: NotificationType.ASSET_CREATED,
      title: "Asset Created Successfully",
      message: `Your asset for ${billToPartyName} (Invoice: ${asset.invoiceNumber}) has been created successfully.`,
      assetId: asset.id,
      roleContext: "seller",
      metadata: {
        invoiceNumber: asset.invoiceNumber,
        billToPartyName: billToPartyName,
        faceValue: asset.faceValueInCents / 100,
        paymentDate: asset.paymentDate,
      },
    };

    return await this.createNotification(notification);
  }

  static async notifyBidReceived(
    sellerUserId: string,
    buyerName: string,
    asset: any,
    bid: any
  ) {
    const notification = {
      userId: sellerUserId,
      type: NotificationType.BID_RECEIVED,
      title: "New Bid Received",
      message: `${buyerName} has placed a bid of €${(bid.centsPerUnit / 100).toFixed(2)} on your asset (Invoice: ${asset.invoiceNumber}).`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "seller",
      metadata: {
        buyerName: buyerName,
        bidAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
      },
    };

    return await this.createNotification(notification);
  }

  // Updated: Notify both buyer and seller when bid is accepted
  static async notifyBidAccepted(
    buyerUserId: string,
    sellerUserId: string,
    sellerName: string,
    asset: any,
    bid: any
  ) {
    const bidAmount = (bid.centsPerUnit / 100).toFixed(2);
    
    // Notification for buyer with buyer role context
    const buyerNotification = {
      userId: buyerUserId,
      type: NotificationType.BID_ACCEPTED,
      title: "Bid Accepted!",
      message: `Congratulations! Your bid of €${bidAmount} for asset (Invoice: ${asset.invoiceNumber}) has been accepted by ${sellerName}.`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "buyer",
      metadata: {
        sellerName: sellerName,
        bidAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
        acceptedAt: new Date().toISOString(),
        paymentDeadline: bid.paymentDeadline,
      },
    };

    // Notification for seller with seller role context
    const sellerNotification = {
      userId: sellerUserId,
      type: NotificationType.BID_ACCEPTED,
      title: "Bid Accepted",
      message: `You have accepted a bid of €${bidAmount} for your asset (Invoice: ${asset.invoiceNumber}).`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "seller",
      metadata: {
        bidAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
        acceptedAt: new Date().toISOString(),
        paymentDeadline: bid.paymentDeadline,
      },
    };

    // Create both notifications
    await this.createMultipleNotifications([buyerNotification, sellerNotification]);
  }

  // Notify buyer when they save a bid
  static async notifyBidSaved(
    buyerUserId: string,
    asset: any,
    bid: any
  ) {
    const notification = {
      userId: buyerUserId,
      type: NotificationType.BID_SAVED,
      title: "Bid Saved Successfully",
      message: `Your bid of €${(bid.centsPerUnit / 100).toFixed(2)} has been saved for asset (Invoice: ${asset.invoiceNumber}).`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "buyer",
      metadata: {
        bidAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
        billToPartyName: asset.billToParty?.name,
      },
    };

    return await this.createNotification(notification);
  }

  // Notify both buyer and seller when payment is made
  static async notifyPaymentMade(
    buyerUserId: string,
    sellerUserId: string,
    asset: any,
    bid: any
  ) {
    const paymentAmount = (bid.centsPerUnit / 100).toFixed(2);

    // Notification for buyer with buyer role context
    const buyerNotification = {
      userId: buyerUserId,
      type: NotificationType.PAYMENT_MADE,
      title: "Payment Confirmed",
      message: `Your payment of €${paymentAmount} has been confirmed for asset (Invoice: ${asset.invoiceNumber}).`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "buyer",
      metadata: {
        paymentAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
        billToPartyName: asset.billToParty?.name,
        paymentDate: new Date().toISOString(),
      },
    };

    // Notification for seller with seller role context
    const sellerNotification = {
      userId: sellerUserId,
      type: NotificationType.PAYMENT_MADE,
      title: "Payment Received",
      message: `Payment of €${paymentAmount} has been confirmed by buyer for asset (Invoice: ${asset.invoiceNumber}).`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "seller",
      metadata: {
        paymentAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
        paymentDate: new Date().toISOString(),
      },
    };

    // Create both notifications
    await this.createMultipleNotifications([buyerNotification, sellerNotification]);
  }

  // NEW: Notify buyer when payment is overdue
  static async notifyPaymentOverdue(
    buyerUserId: string,
    asset: any,
    bid: any
  ) {
    const notification = {
      userId: buyerUserId,
      type: NotificationType.PAYMENT_OVERDUE,
      title: "Payment Overdue",
      message: `Your payment for asset (Invoice: ${asset.invoiceNumber}) is now overdue. This contract has been disabled.`,
      assetId: asset.id,
      bidId: bid.id,
      roleContext: "buyer",
      metadata: {
        bidAmount: bid.centsPerUnit / 100,
        invoiceNumber: asset.invoiceNumber,
        paymentDeadline: bid.paymentDeadline,
        overdueAt: new Date().toISOString(),
      },
    };

    return await this.createNotification(notification);
  }

  // Notify seller when fee is approved (by seller in app)
  static async notifyFeeApproved(
    sellerUserId: string,
    asset: any
  ) {
    const feeAmount = ((asset.feesInCents || 0) / 100).toFixed(2);
    
    const notification = {
      userId: sellerUserId,
      type: NotificationType.FEE_APPROVED,
      title: "Fee Approved",
      message: `Fee of €${feeAmount} has been approved for asset (Invoice: ${asset.invoiceNumber}).`,
      assetId: asset.id,
      roleContext: "seller",
      metadata: {
        feeAmount: (asset.feesInCents || 0) / 100,
        invoiceNumber: asset.invoiceNumber,
        faceValue: asset.faceValueInCents / 100,
        approvedAt: new Date().toISOString(),
      },
    };

    return await this.createNotification(notification);
  }

  // Notify seller when bill to party validates the asset
  static async notifyBillToPartyValidated(
    sellerUserId: string,
    asset: any,
    billToPartyName: string
  ) {
    const notification = {
      userId: sellerUserId,
      type: NotificationType.BILL_TO_PARTY_VALIDATED,
      title: "Asset Validated by Bill-To Party",
      message: `${billToPartyName} has validated your asset (Invoice: ${asset.invoiceNumber}). You can now post the token.`,
      assetId: asset.id,
      roleContext: "seller",
      metadata: {
        invoiceNumber: asset.invoiceNumber,
        billToPartyName: billToPartyName,
        faceValue: asset.faceValueInCents / 100,
        validatedAt: new Date().toISOString(),
      },
    };

    return await this.createNotification(notification);
  }

  // Notify seller when asset is posted
  static async notifyAssetPosted(
    sellerUserId: string,
    asset: any
  ) {
    const notification = {
      userId: sellerUserId,
      type: NotificationType.ASSET_POSTED,
      title: "Asset Posted to Liqwik",
      message: `Your asset (Invoice: ${asset.invoiceNumber}) has been posted to Liqwik and is now visible in your portfolio.`,
      assetId: asset.id,
      roleContext: "seller",
      metadata: {
        invoiceNumber: asset.invoiceNumber,
        faceValue: asset.faceValueInCents / 100,
        postedAt: new Date().toISOString(),
      },
    };

    return await this.createNotification(notification);
  }

  // Notify seller when asset is cancelled
  static async notifyAssetCancelled(
    sellerUserId: string,
    asset: any
  ) {
    const notification = {
      userId: sellerUserId,
      type: NotificationType.ASSET_CANCELLED,
      title: "Asset Cancelled",
      message: `Your asset (Invoice: ${asset.invoiceNumber}) has been cancelled and is no longer available.`,
      assetId: asset.id,
      roleContext: "seller",
      metadata: {
        invoiceNumber: asset.invoiceNumber,
        faceValue: asset.faceValueInCents / 100,
        cancelledAt: new Date().toISOString(),
      },
    };

    return await this.createNotification(notification);
  }
}