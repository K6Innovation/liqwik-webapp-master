// src/app/api/sellers/[id]/assets/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getSellerOrgs } from "@/utils/api/get-user-orgs";
import { NotificationService } from "@/utils/notification-service";
import { FileUploadService } from "@/utils/file-upload";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
  const assets = await prisma.asset.findMany({
    where: {
      sellerId: {
        in: userOrgs.map((org) => org.id),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      bids: true,
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
    const faceValueInCents = parseInt((formData.get("faceValue") || "") as string) * 100;
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
      include: {
        contact: {
          include: {
            user: true,
          },
        },
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

    // Create asset first to get the ID
    const assetData: any = {
      invoiceNumber: formData.get("invoiceNumber"),
      invoiceDate: dayjs(invoiceDate).toDate(),
      faceValueInCents,
      paymentDate: dayjs(paymentDate).toDate(),
      termMonths: termMonths,
      apy: apy,
      feesInCents: feesInCents,
      feeApprovedBySeller: false,
      validatedByBillToParty: false,
    };

    const asset = await prisma.asset.create({
      data: {
        ...assetData,
        seller: { connect: { id: seller.id } },
        billToParty: { connect: { id: billToParty.id } },
      },
    });

    // Handle file uploads
    const invoiceFile = formData.get("invoiceFile") as File;
    const bankStatementFile = formData.get("bankStatementFile") as File;
    const billToPartyHistoryFile = formData.get("billToPartyHistoryFile") as File;

    const filePaths: any = {};

    if (invoiceFile && invoiceFile.size > 0) {
      const validation = FileUploadService.validateFile(invoiceFile);
      if (!validation.valid) {
        throw new CustomError(validation.error || "Invalid invoice file", 400);
      }
      filePaths.invoiceFilePath = await FileUploadService.saveFile(
        invoiceFile,
        asset.id,
        "invoice"
      );
    }

    if (bankStatementFile && bankStatementFile.size > 0) {
      const validation = FileUploadService.validateFile(bankStatementFile);
      if (!validation.valid) {
        throw new CustomError(validation.error || "Invalid bank statement file", 400);
      }
      filePaths.bankStatementFilePath = await FileUploadService.saveFile(
        bankStatementFile,
        asset.id,
        "bankStatement"
      );
    }

    if (billToPartyHistoryFile && billToPartyHistoryFile.size > 0) {
      const validation = FileUploadService.validateFile(billToPartyHistoryFile);
      if (!validation.valid) {
        throw new CustomError(validation.error || "Invalid bill to party history file", 400);
      }
      filePaths.billToPartyHistoryFilePath = await FileUploadService.saveFile(
        billToPartyHistoryFile,
        asset.id,
        "billToPartyHistory"
      );
    }

    // Update asset with file paths
    const updatedAsset = await prisma.asset.update({
      where: { id: asset.id },
      data: filePaths,
    });

    // Create notification for seller when asset is created
    await NotificationService.notifyAssetCreated(
      seller.contact.user.id,
      updatedAsset,
      billToParty.name
    );

    // Return asset with calculated face value
    const responseAsset = {
      ...updatedAsset,
      faceValue: faceValueInCents / 100,
    };

    return NextResponse.json(responseAsset);
  } catch (error: any) {
    console.error("Error creating asset:", error);
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate Bill-to Party / Invoice Number" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}