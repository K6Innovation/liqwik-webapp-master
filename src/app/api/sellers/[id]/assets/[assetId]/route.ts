// src/app/api/sellers/[id]/assets/[assetId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getSellerOrgs } from "@/utils/api/get-user-orgs";
import { FileUploadService } from "@/utils/file-upload";

const assetIncludes = {
  include: {
    billToParty: {
      select: {
        id: true,
        name: true,
      },
    },
  },
};

async function getAssetBids(assetId: string) {
  const bids = await prisma.assetBid.findMany({
    where: {
      assetId,
    },
    include: {
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
  return bids;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  const userId = params.id;
  const assetId = params.assetId;
  const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
  if (userOrgs.length === 0) {
    throw new CustomError("User is not associated with an Asset Seller", 400);
  }
  const asset: any = await prisma.asset.findUnique({
    where: {
      id: assetId,
    },
    ...assetIncludes,
  });
  asset.bids = await getAssetBids(assetId);
  return NextResponse.json(asset);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Seller", 400);
    }
    const formData = await req.formData();
    const assetId = formData.get("id") as string;
    if (!assetId) {
      throw new CustomError("Asset Id is required", 400);
    }
    const faceValueInCents =
      parseInt((formData.get("faceValue") || "") as string) * 100;
    if (faceValueInCents && isNaN(faceValueInCents)) {
      throw new CustomError("INVALID_REQUEST", 400);
    }
    const invoiceDate = formData.get("invoiceDate") as string;
    if (!invoiceDate) {
      throw new CustomError("Invoice Date is required", 400);
    }
    const paymentDate = formData.get("paymentDate") as string;
    if (!paymentDate) {
      throw new CustomError("Payment Date is required", 400);
    }
    
    const termMonths = parseInt(formData.get("termMonths") as string);
    if (isNaN(termMonths)) {
      throw new CustomError("Term Months is required", 400);
    }

    // Get APY and fees from form data
    const apy = parseFloat(formData.get("apy") as string) || 0;
    const fees = parseFloat(formData.get("fees") as string) || 0;
    const feesInCents = Math.round(fees * 100);

    const seller = await prisma.assetSeller.findFirst({
      where: {
        id: userOrgs[0].id,
      },
    });
    if (!seller) {
      throw new CustomError("Seller not found", 400);
    }
    const billToPartyId = formData.get("billToPartyId") as string;
    const billToParty = await prisma.billToParty.findFirst({
      where: {
        id: billToPartyId,
      },
    });
    if (!billToParty) {
      throw new CustomError("Bill To Party not found", 400);
    }
    
    const assetData: any = {
      invoiceNumber: formData.get("invoiceNumber"),
      invoiceDate: dayjs(invoiceDate).toDate(),
      faceValueInCents,
      paymentDate: dayjs(paymentDate).toDate(),
      termMonths: termMonths,
      apy: apy,
      feesInCents: feesInCents,
    };

    // Handle file uploads if new files are provided
    const invoiceFile = formData.get("invoiceFile") as File;
    const bankStatementFile = formData.get("bankStatementFile") as File;
    const billToPartyHistoryFile = formData.get("billToPartyHistoryFile") as File;

    if (invoiceFile && invoiceFile.size > 0) {
      const validation = FileUploadService.validateFile(invoiceFile);
      if (!validation.valid) {
        throw new CustomError(validation.error || "Invalid invoice file", 400);
      }
      assetData.invoiceFilePath = await FileUploadService.saveFile(
        invoiceFile,
        assetId,
        "invoice"
      );
    }

    if (bankStatementFile && bankStatementFile.size > 0) {
      const validation = FileUploadService.validateFile(bankStatementFile);
      if (!validation.valid) {
        throw new CustomError(validation.error || "Invalid bank statement file", 400);
      }
      assetData.bankStatementFilePath = await FileUploadService.saveFile(
        bankStatementFile,
        assetId,
        "bankStatement"
      );
    }

    if (billToPartyHistoryFile && billToPartyHistoryFile.size > 0) {
      const validation = FileUploadService.validateFile(billToPartyHistoryFile);
      if (!validation.valid) {
        throw new CustomError(validation.error || "Invalid bill to party history file", 400);
      }
      assetData.billToPartyHistoryFilePath = await FileUploadService.saveFile(
        billToPartyHistoryFile,
        assetId,
        "billToPartyHistory"
      );
    }

    const updatedAsset: any = await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        ...assetData,
        billToParty: {
          connect: {
            id: billToParty.id,
          },
        },
      },
      ...assetIncludes,
    });
    updatedAsset.bids = await getAssetBids(assetId);
    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error("Error updating asset:", error);
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}