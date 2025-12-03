// src/app/api/sellers/[id]/assets/[assetId]/approve-fee/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import CustomError from "@/utils/custom-error";
import { getSellerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";
import { emailService } from "@/utils/email-service";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const userId = params.id;
    const assetId = params.assetId;

    // Verify user is a seller
    const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Seller", 400);
    }

    // Get the asset
    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
      include: {
        seller: {
          include: {
            contact: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new CustomError("Asset not found", 404);
    }

    // Verify asset belongs to this seller
    if (!userOrgs.some(org => org.id === asset.sellerId)) {
      throw new CustomError("Unauthorized", 403);
    }

    // Check if already approved
    if (asset.feeApprovedBySeller) {
      throw new CustomError("Fee is already approved", 400);
    }

    // Generate validation token for bill to party
    const billToPartyValidationToken = crypto.randomBytes(32).toString('hex');

    // Update asset to mark fee as approved and add validation token
    const updatedAsset = await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        feeApprovedBySeller: true,
        feeApprovedAt: new Date(),
        billToPartyValidationToken: billToPartyValidationToken,
      },
    });

    // Send confirmation email to seller
    try {
      const sellerEmail = asset.seller.contact.user.email;
      const sellerName = asset.seller.name;
      
      await emailService.sendSellerFeeConfirmationEmail(
        sellerEmail,
        sellerName,
        {
          invoiceNumber: updatedAsset.invoiceNumber,
          feeAmount: ((updatedAsset.feesInCents || 0) / 100).toFixed(2),
          faceValue: updatedAsset.faceValueInCents / 100,
          paymentDate: updatedAsset.paymentDate.toISOString(),
          approvedAt: new Date().toISOString(),
        }
      );

      console.log(`Fee confirmation email sent to ${sellerEmail}`);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the approval if email fails - just log it
    }

    // Send bell notification to seller about fee approval
    try {
      await NotificationService.notifyFeeApproved(
        asset.seller.contact.user.id,
        updatedAsset
      );
      console.log(`Bell notification sent to seller ${asset.seller.contact.user.id} for fee approval`);
    } catch (notificationError) {
      console.error("Error sending fee approval notification:", notificationError);
      // Don't fail the approval if notification fails
    }

    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error("Error approving fee:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}