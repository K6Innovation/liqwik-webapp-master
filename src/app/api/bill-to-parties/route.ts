// src/app/api/bill-to-parties/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import { getServerSession } from "next-auth";
import authOptions from "@/auth-options";


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Build where clause - filter by createdByUserId if userId is provided
    const whereClause = userId 
      ? { createdByUserId: userId }
      : {};

    const billToParties = await prisma.billToParty.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        createdByUserId: true,
        liqwikRating: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(billToParties);
  } catch (error) {
    console.error('Error fetching bill-to parties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill-to parties' },
      { status: 500 }
    );
  }
}