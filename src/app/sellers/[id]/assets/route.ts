import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { uploadFile } from "@/utils/file-upload";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;
    const formData = await request.formData();

    // Extract form fields
    const id = formData.get("id") as string | null;
    const billToPartyId = formData.get("billToPartyId") as string;
    const invoiceNumber = formData.get("invoiceNumber") as string;
    const invoiceDate = formData.get("invoiceDate") as string;
    const faceValue = parseFloat(formData.get("faceValue") as string);
    const paymentDate = formData.get("paymentDate") as string;
    const proposedDiscount = formData.get("proposedDiscount") as string;
    const termMonths = parseInt(formData.get("termMonths") as string);
    const apy = parseFloat(formData.get("apy") as string);
    const fees = parseFloat(formData.get("fees") as string);

    // Handle file uploads
    const invoiceFile = formData.get("invoiceFile") as File | null;
    const bankStatementFile = formData.get("bankStatementFile") as File | null;
    const billToPartyHistoryFile = formData.get("billToPartyHistoryFile") as File | null;

    let invoiceFilePath: string | undefined;
    let bankStatementFilePath: string | undefined;
    let billToPartyHistoryFilePath: string | undefined;

    // Upload invoice file
    if (invoiceFile && invoiceFile.size > 0) {
      const uploadResult = await uploadFile(invoiceFile, "invoice", sellerId);
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 400 }
        );
      }
      invoiceFilePath = uploadResult.filePath;
    }

    // Upload bank statement file
    if (bankStatementFile && bankStatementFile.size > 0) {
      const uploadResult = await uploadFile(bankStatementFile, "bankStatement", sellerId);
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 400 }
        );
      }
      bankStatementFilePath = uploadResult.filePath;
    }

    // Upload bill to party history file
    if (billToPartyHistoryFile && billToPartyHistoryFile.size > 0) {
      const uploadResult = await uploadFile(billToPartyHistoryFile, "billToPartyHistory", sellerId);
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 400 }
        );
      }
      billToPartyHistoryFilePath = uploadResult.filePath;
    }

    // Prepare asset data
    const assetData: any = {
      sellerId,
      billToPartyId,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      faceValueInCents: Math.round(faceValue * 100),
      paymentDate: new Date(paymentDate),
      proposedDiscount: proposedDiscount ? parseInt(proposedDiscount) : null,
      termMonths,
      apy,
      feesInCents: Math.round(fees * 100),
      auctionStatus: "DRAFT",
    };

    // Add file paths if files were uploaded
    if (invoiceFilePath) assetData.invoiceFilePath = invoiceFilePath;
    if (bankStatementFilePath) assetData.bankStatementFilePath = bankStatementFilePath;
    if (billToPartyHistoryFilePath) assetData.billToPartyHistoryFilePath = billToPartyHistoryFilePath;

    let asset;

    if (id) {
      // Update existing asset
      asset = await prisma.asset.update({
        where: { id },
        data: assetData,
        include: {
          seller: true,
          billToParty: true,
          bids: {
            include: {
              buyer: true,
            },
          },
        },
      });
    } else {
      // Create new asset
      asset = await prisma.asset.create({
        data: assetData,
        include: {
          seller: true,
          billToParty: true,
          bids: {
            include: {
              buyer: true,
            },
          },
        },
      });
    }

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error("Error saving asset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save asset" },
      { status: 500 }
    );
  }
}