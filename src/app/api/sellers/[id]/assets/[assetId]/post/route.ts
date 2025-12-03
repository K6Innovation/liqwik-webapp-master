// src/app/api/sellers/[id]/assets/[assetId]/post/route.ts

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

    // Check if fee is approved
    if (!asset.feeApprovedBySeller) {
      throw new CustomError("Fee must be approved before posting", 400);
    }

    // Check if already posted
    if (asset.isPosted) {
      throw new CustomError("Asset is already posted", 400);
    }

    // Check if cancelled
    if (asset.isCancelled) {
      throw new CustomError("Cannot post a cancelled asset", 400);
    }

    // Update asset to posted
    const updatedAsset = await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        isPosted: true,
        postedAt: new Date(),
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
    await NotificationService.notifyAssetPosted(
      asset.seller.contact.user.id,
      updatedAsset
    );

    // Send email notification to seller
    try {
      await emailService.sendAssetPostedEmail({
        sellerEmail: asset.seller.contact.user.email,
        sellerName: asset.seller.name,
        invoiceNumber: updatedAsset.invoiceNumber,
        faceValue: updatedAsset.faceValueInCents / 100,
        feeAmount: asset.feesInCents ? (asset.feesInCents / 100).toFixed(2) : "0.00",
        paymentDate: updatedAsset.paymentDate.toISOString(),
        postedAt: updatedAsset.postedAt!.toISOString(),
        assetId: updatedAsset.id,
      });
    } catch (emailError) {
      console.error("Error sending posted email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error("Error posting asset:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}