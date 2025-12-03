// src/app/api/sellers/[id]/assets/[assetId]/cancel/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import CustomError from "@/utils/custom-error";
import { getSellerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";
import { emailService } from "@/utils/email-service";

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

    // Check if already cancelled
    if (asset.isCancelled) {
      throw new CustomError("Asset is already cancelled", 400);
    }

    // Update asset to cancelled
    const updatedAsset = await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
      },
      include: {
        billToParty: {
          select: {
            id: true,
            name: true,
          },
        },
        bids: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Create notification
    await NotificationService.notifyAssetCancelled(
      asset.seller.contact.user.id,
      updatedAsset
    );

    // Send email notification to seller
    try {
      await emailService.sendAssetCancelledEmail({
        sellerEmail: asset.seller.contact.user.email,
        sellerName: asset.seller.name,
        invoiceNumber: updatedAsset.invoiceNumber,
        faceValue: updatedAsset.faceValueInCents / 100,
        cancelledAt: updatedAsset.cancelledAt!.toISOString(),
        assetId: updatedAsset.id,
      });
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error("Error cancelling asset:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}