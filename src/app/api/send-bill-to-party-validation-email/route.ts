// src/app/api/send-bill-to-party-validation-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/utils/email-service";
import prisma from "@/utils/prisma-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { billToPartyEmail, billToPartyName, sellerName, assetData } = body;

    if (!billToPartyEmail || !billToPartyName || !sellerName || !assetData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the asset to retrieve validation token
    const asset = await prisma.asset.findUnique({
      where: {
        id: assetData.id,
      },
      select: {
        billToPartyValidationToken: true,
      },
    });

    if (!asset || !asset.billToPartyValidationToken) {
      return NextResponse.json(
        { error: "Asset or validation token not found" },
        { status: 404 }
      );
    }

    await emailService.sendBillToPartyValidationEmail(
      billToPartyEmail,
      billToPartyName,
      sellerName,
      {
        invoiceNumber: assetData.invoiceNumber,
        faceValue: assetData.faceValue,
        feeAmount: assetData.feeAmount,
        paymentDate: assetData.paymentDate,
        validationToken: asset.billToPartyValidationToken,
      }
    );

    // Mark validation email as sent
    await prisma.asset.update({
      where: {
        id: assetData.id,
      },
      data: {
        billToPartyValidationEmailSent: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending bill to party validation email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}