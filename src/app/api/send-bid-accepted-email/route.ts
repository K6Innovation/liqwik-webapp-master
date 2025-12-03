// src/app/api/send-bid-accepted-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/utils/email-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      buyerEmail,
      buyerName,
      sellerName,
      invoiceNumber,
      faceValue,
      bidAmount,
      discount,
      paymentDeadline,
      invoiceDate,
      paymentDate,
      paymentApprovalToken,
      bidId,
    } = body;

    // Validate all required fields
    if (
      !buyerEmail ||
      !buyerName ||
      !sellerName ||
      !invoiceNumber ||
      !faceValue ||
      !bidAmount ||
      !paymentDeadline ||
      !paymentApprovalToken ||
      !bidId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await emailService.sendBidAcceptedEmail({
      buyerEmail,
      buyerName,
      sellerName,
      invoiceNumber,
      faceValue,
      bidAmount,
      discount,
      paymentDeadline: new Date(paymentDeadline),
      invoiceDate,
      paymentDate,
      paymentApprovalToken,
      bidId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending bid accepted email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}