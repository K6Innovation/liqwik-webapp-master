// src/app/api/buyers/[id]/assets/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getBuyerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
  
  if (userOrgs.length === 0) {
    throw new CustomError("User is not associated with an Asset Buyer", 400);
  }

  const { searchParams } = new URL(req.url);
  const filterByBids = searchParams.get("filterByBids") === "true";

  let whereClause: any = {
    isPosted: true,
    isCancelled: false,
  };

  if (filterByBids) {
    // For "My Liqwik": Only show assets where this buyer has placed bids
    whereClause.bids = {
      some: {
        buyerId: {
          in: userOrgs.map((org) => org.id),
        },
      },
    };
  }

  const assets = await prisma.asset.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    include: {
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
                    },
                  },
                },
              },
            },
          },
        },
      },
      billToParty: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Check for overdue bids and update them
  const now = new Date();
  for (const asset of assets) {
    for (const bid of asset.bids) {
      const isBuyerBid = userOrgs.some(org => org.id === bid.buyerId);
      
      if (
        isBuyerBid &&
        bid.accepted &&
        !bid.paymentApprovedByBuyer &&
        !bid.isOverdue &&
        bid.paymentDeadline &&
        now > new Date(bid.paymentDeadline)
      ) {
        await prisma.assetBid.update({
          where: { id: bid.id },
          data: {
            isOverdue: true,
            rejected: true,
            rejectedAt: now,
          },
        });

        bid.isOverdue = true;
        bid.rejected = true;
        bid.rejectedAt = now;

        try {
          await NotificationService.notifyPaymentOverdue(
            bid.buyer.contact.user.id,
            asset,
            bid
          );
        } catch (error) {
          console.error("Failed to send overdue notification:", error);
        }
      }
    }
  }

  const responseObj = assets.map((asset) => {
    // Check if asset has any overdue bids (can accept other bids)
    const hasOverdueBid = asset.bids.some((bid: any) => bid.isOverdue);
    
    // Check if there's currently a non-overdue accepted bid
    const hasActiveAcceptedBid = asset.bids.some(
      (bid: any) => bid.accepted && !bid.isOverdue
    );
    
    // For marketplace visibility: show if no active accepted bid OR has overdue bid
    const canAcceptOtherBids = hasOverdueBid && !hasActiveAcceptedBid;

    return {
      ...asset,
      numDaysForPayment: dayjs(asset.paymentDate).diff(dayjs(), "days"),
      hasOverdueBid,
      canAcceptOtherBids,
    };
  });

  return NextResponse.json(responseObj);
}