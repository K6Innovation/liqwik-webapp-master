// src/app/api/buyers/[id]/bids/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/utils/prisma-client";
import authOptions from "@/auth-options";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const user = session.user as any;

    // Verify the user is accessing their own data
    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the buyer's UserRole record
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: userId,
        role: {
          name: "buyer",
        },
      },
      include: {
        buyer: true,
      },
    });

    if (!userRole || !userRole.buyer) {
      return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
    }

    const buyerId = userRole.buyer.id;

    // Fetch all accepted bids by this buyer with their associated assets
    const bids = await prisma.assetBid.findMany({
      where: {
        buyerId: buyerId,
        accepted: true, // Only accepted bids
      },
      include: {
        asset: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
            billToParty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bids, { status: 200 });
  } catch (error) {
    console.error("Error fetching buyer bids:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}