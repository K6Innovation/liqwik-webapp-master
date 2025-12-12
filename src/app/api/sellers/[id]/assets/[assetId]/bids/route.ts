// src/app/api/sellers/[id]/assets/[assetId]/bids/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getSellerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";
import { emailService } from "@/utils/email-service";
import { randomBytes } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Seller", 400);
    }

    const assetId = params.assetId;
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
        billToParty: true,
        bids: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                contact: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
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

    const { bidId, action } = await req.json();
    const bid = asset.bids.find((b) => b.id === bidId);
    if (!bid) {
      throw new CustomError("Bid not found", 400);
    }

    let update: any;
    
    if (action === "accept") {
      // Calculate 24-hour payment deadline
      const paymentDeadline = dayjs().add(24, 'hours').toDate();
      
      // Generate payment approval token
      const paymentApprovalToken = randomBytes(32).toString("hex");
      
      update = { 
        accepted: true, 
        acceptedAt: new Date(),
        paymentDeadline: paymentDeadline,
        paymentApprovalToken: paymentApprovalToken,
        paymentApprovedByBuyer: false,
        paymentApprovedAt: null,
        rejected: false,
        rejectedAt: null
      };

      // Update the accepted bid
      await prisma.assetBid.update({
        where: {
          id: bidId,
        },
        data: update,
      });

      // Automatically reject all other bids for this asset
      const otherBids = asset.bids.filter((b) => b.id !== bidId);
      
      if (otherBids.length > 0) {
        await prisma.assetBid.updateMany({
          where: {
            assetId: assetId,
            id: { not: bidId },
            accepted: false,
          },
          data: {
            rejected: true,
            rejectedAt: new Date(),
          },
        });

        // Send rejection notifications to all other buyers
        for (const rejectedBid of otherBids) {
          try {
            await NotificationService.notifyBidRejected(
              rejectedBid.buyer.contact.user.id,
              asset.seller.name,
              asset,
              rejectedBid
            );
            console.log(`Rejection notification sent to buyer ${rejectedBid.buyer.contact.user.id}`);
          } catch (notificationError) {
            console.error("Failed to send bid rejection notification:", notificationError);
          }
        }
      }

      // Send email to accepted buyer with payment approval link
      const buyerEmail = bid.buyer.contact.user.email;
      const buyerName = bid.buyer.name || 
        `${bid.buyer.contact.user.firstName || ''} ${bid.buyer.contact.user.lastName || ''}`.trim() ||
        buyerEmail;
      
      const bidAmount = (bid.numUnits * bid.centsPerUnit) / 100;
      const faceValue = asset.faceValueInCents / 100;

      await emailService.sendBidAcceptedEmail({
        buyerEmail: buyerEmail,
        buyerName: buyerName,
        sellerName: asset.seller.name,
        invoiceNumber: asset.invoiceNumber,
        faceValue: faceValue,
        bidAmount: bidAmount,
        discount: ((faceValue - bidAmount) / faceValue) * 100,
        paymentDeadline: paymentDeadline,
        invoiceDate: asset.invoiceDate.toISOString(),
        paymentDate: asset.paymentDate.toISOString(),
        paymentApprovalToken: paymentApprovalToken,
        bidId: bid.id
      });

      console.log(`Bid acceptance email sent to ${buyerEmail} with payment approval token`);

      // Send bell notifications to both buyer and seller for accepted bid
      try {
        await NotificationService.notifyBidAccepted(
          bid.buyer.contact.user.id, // buyer user ID
          asset.seller.contact.user.id, // seller user ID
          asset.seller.name, // seller name
          asset,
          bid
        );
        console.log(`Bell notifications sent to buyer ${bid.buyer.contact.user.id} and seller ${asset.seller.contact.user.id} for bid acceptance`);
      } catch (notificationError) {
        console.error("Failed to send bid acceptance notifications:", notificationError);
        // Don't fail the request if notification fails
      }

    } else if (action === "cancel-accept") {
      // When cancelling an acceptance, also unreject the other bids
      update = { 
        accepted: false, 
        acceptedAt: null,
        paymentDeadline: null,
        paymentApprovalToken: null,
        paymentApprovedByBuyer: false,
        paymentApprovedAt: null
      };

      await prisma.assetBid.update({
        where: {
          id: bidId,
        },
        data: update,
      });

      // Unreject other bids to allow seller to accept them again
      await prisma.assetBid.updateMany({
        where: {
          assetId: assetId,
          id: { not: bidId },
          rejected: true,
        },
        data: {
          rejected: false,
          rejectedAt: null,
        },
      });

    } else if (action === "reject") {
      // Manually reject a specific bid
      update = {
        rejected: true,
        rejectedAt: new Date(),
        accepted: false,
        acceptedAt: null,
      };

      await prisma.assetBid.update({
        where: {
          id: bidId,
        },
        data: update,
      });

      // Notify buyer about bid rejection
      try {
        await NotificationService.notifyBidRejected(
          bid.buyer.contact.user.id,
          asset.seller.name,
          asset,
          bid
        );
        console.log(`Rejection notification sent to buyer ${bid.buyer.contact.user.id}`);
      } catch (notificationError) {
        console.error("Failed to send bid rejection notification:", notificationError);
      }
    }

    // Return all bids for this asset
    const bids = await prisma.assetBid.findMany({
      where: {
        assetId: assetId,
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            contact: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bids);
  } catch (error: any) {
    console.log(error);
    const errObj = { status: "error" };
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}