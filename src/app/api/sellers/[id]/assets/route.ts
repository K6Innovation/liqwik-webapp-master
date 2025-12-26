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
      if (
        bid.accepted &&
        !bid.paymentApprovedByBuyer &&
        !bid.isOverdue &&
        bid.paymentDeadline &&
        now > new Date(bid.paymentDeadline)
      ) {
        // Mark bid as overdue
        await prisma.assetBid.update({
          where: { id: bid.id },
          data: {
            isOverdue: true,
            rejected: true,
            rejectedAt: now,
          },
        });

        // Update the bid in the current response
        bid.isOverdue = true;
        bid.rejected = true;
        bid.rejectedAt = now;

        // Notify buyer about overdue payment
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
    // Check if asset has any overdue bids (meaning it can accept other bids)
    const hasOverdueBid = asset.bids.some((bid: any) => bid.isOverdue);
    
    // Check if there's currently an active (non-overdue) accepted bid
    const hasActiveAcceptedBid = asset.bids.some(
      (bid: any) => bid.accepted && !bid.isOverdue
    );

    return {
      ...asset,
      numDaysForPayment: dayjs(asset.paymentDate).diff(dayjs(), "days"),
      hasOverdueBid,
      canAcceptOtherBids: hasOverdueBid && !hasActiveAcceptedBid,
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

    const updatedAsset = await prisma.asset.update({
      where: { id: asset.id },
      data: filePaths,
    });

    await NotificationService.notifyAssetCreated(
      seller.contact.user.id,
      updatedAsset,
      billToParty.name
    );

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