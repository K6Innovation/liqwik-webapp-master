// src/app/api/sellers/[id]/assets/[assetId]/check-validation/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const { assetId } = params;

    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
      select: {
        validatedByBillToParty: true,
        billToPartyValidatedAt: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      validatedByBillToParty: asset.validatedByBillToParty,
      billToPartyValidatedAt: asset.billToPartyValidatedAt,
    });
  } catch (error) {
    console.error("Error checking validation status:", error);
    return NextResponse.json(
      { error: "Failed to check validation status" },
      { status: 500 }
    );
  }
}