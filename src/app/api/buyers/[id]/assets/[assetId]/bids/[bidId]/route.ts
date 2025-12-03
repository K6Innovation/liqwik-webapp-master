// src/app/api/buyers/[id]/assets/[assetId]/bids/[bidId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getBuyerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string; bidId: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Buyer", 400);
    }
    
    const assetId = params.assetId;
    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
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
                contact: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!asset) {
      throw new CustomError("Asset not found", 400);
    }
    
    const bidId = params.bidId;
    const bid = asset.bids.find((b) => b.id === bidId);
    if (!bid) {
      throw new CustomError("Bid not found", 400);
    }
    
    const formData: any = await req.formData();
    const totalAmount = formData.get("totalAmount");
    
    const updatedBid = await prisma.assetBid.update({
      where: {
        id: bidId,
      },
      data: {
        numUnits: 1,
        centsPerUnit: totalAmount * 100,
      },
    });

    // Notify buyer that their bid was updated/saved
    const buyerUserId = bid.buyer.contact.user.id;
    await NotificationService.notifyBidSaved(
      buyerUserId,
      asset,
      updatedBid
    );

    return NextResponse.json(updatedBid);
  } catch (error: any) {
    console.log(error);
    const errObj = { status: "error" };
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH endpoint for payment approval
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string; bidId: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Buyer", 400);
    }

    const assetId = params.assetId;
    const bidId = params.bidId;

    const body = await req.json();
    const { paymentApproved } = body;

    if (typeof paymentApproved !== 'boolean') {
      throw new CustomError("paymentApproved field is required", 400);
    }

    // Fetch asset and bid with full details including seller
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        billToParty: {
          select: {
            id: true,
            name: true,
          },
        },
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
      throw new CustomError("Asset not found", 400);
    }

    const bid = await prisma.assetBid.findUnique({
      where: { id: bidId },
      include: {
        buyer: {
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

    if (!bid) {
      throw new CustomError("Bid not found", 400);
    }

    // Verify the buyer making the request owns this bid
    if (bid.buyerId !== userOrgs[0].id) {
      throw new CustomError("Unauthorized: You can only approve payment for your own bids", 403);
    }

    // Update bid with payment approval
    const updatedBid = await prisma.assetBid.update({
      where: { id: bidId },
      data: {
        paymentApprovedByBuyer: paymentApproved,
        paymentApprovedAt: paymentApproved ? new Date() : null,
      },
    });

    // NEW: If payment is approved, send bell notifications to both buyer and seller
    if (paymentApproved) {
      try {
        await NotificationService.notifyPaymentMade(
          bid.buyer.contact.user.id,
          asset.seller.contact.user.id,
          asset,
          updatedBid
        );
        console.log(`Payment notifications sent to buyer ${bid.buyer.contact.user.id} and seller ${asset.seller.contact.user.id}`);
      } catch (notificationError) {
        console.error("Failed to send payment notifications:", notificationError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(updatedBid);
  } catch (error: any) {
    console.error("Payment approval error:", error);
    if (error.message === "INVALID_REQUEST" || error instanceof CustomError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}