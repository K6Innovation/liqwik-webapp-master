// src/app/api/assets/[assetId]/documents/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";

export async function GET(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params;

    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
      select: {
        id: true,
        invoiceFilePath: true,
        bankStatementFilePath: true,
        billToPartyHistoryFilePath: true,
        invoiceNumber: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    const documents = [];

    if (asset.invoiceFilePath) {
      documents.push({
        type: "Invoice",
        name: `Invoice_${asset.invoiceNumber}`,
        path: asset.invoiceFilePath,
        fileName: asset.invoiceFilePath.split("/").pop(),
      });
    }

    if (asset.bankStatementFilePath) {
      documents.push({
        type: "Bank Statement",
        name: "12 Months Bank Statement",
        path: asset.bankStatementFilePath,
        fileName: asset.bankStatementFilePath.split("/").pop(),
      });
    }

    if (asset.billToPartyHistoryFilePath) {
      documents.push({
        type: "Bill-To Party History",
        name: "Bill-To Party History",
        path: asset.billToPartyHistoryFilePath,
        fileName: asset.billToPartyHistoryFilePath.split("/").pop(),
      });
    }

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}