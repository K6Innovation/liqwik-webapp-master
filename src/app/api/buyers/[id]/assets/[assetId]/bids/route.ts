// src/app/api/buyers/[id]/assets/[assetId]/bids/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getBuyerOrgs, getSellerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
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
        seller: {
          include: {
            contact: {
              include: {
                user: true,
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

    if (!asset) {
      throw new CustomError("Asset not found", 400);
    }

    const buyer = await prisma.assetBuyer.findFirst({
      where: {
        id: userOrgs[0].id,
      },
      include: {
        contact: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!buyer) {
      throw new CustomError("Buyer not found", 400);
    }

    const formData: any = await req.formData();
    const totalAmount = formData.get("totalAmount");

    const bid = await prisma.assetBid.create({
      data: {
        assetId,
        buyerId: buyer.id,
        createdAt: new Date(),
        numUnits: 1,
        centsPerUnit: totalAmount * 100,
      },
    });

    // Notify the seller about the new bid
    await NotificationService.notifyBidReceived(
      asset.seller.contact.user.id,
      buyer.name,
      asset,
      bid
    );

    // NEW: Notify the buyer that their bid was saved successfully
    await NotificationService.notifyBidSaved(
      buyer.contact.user.id,
      asset,
      bid
    );

    return NextResponse.json(bid);
  } catch (error: any) {
    console.log(error);
    const errObj = { status: "error" };
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}