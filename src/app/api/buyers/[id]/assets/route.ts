// src/app/api/buyers/[id]/assets/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getBuyerOrgs } from "@/utils/api/get-user-orgs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
  
  if (userOrgs.length === 0) {
    throw new CustomError("User is not associated with an Asset Buyer", 400);
  }

  // Check if we should filter by bids (for "My Liqwik" page)
  const { searchParams } = new URL(req.url);
  const filterByBids = searchParams.get("filterByBids") === "true";

  let whereClause: any = {
    // Only show posted assets to buyers
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
  // For marketplace: show all posted and not cancelled assets

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

  const responseObj = assets.map((asset) => {
    return {
      ...asset,
      numDaysForPayment: dayjs(asset.paymentDate).diff(dayjs(), "days"),
    };
  });

  return NextResponse.json(responseObj);
}