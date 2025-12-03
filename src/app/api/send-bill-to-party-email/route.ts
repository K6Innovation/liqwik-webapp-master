// src/app/api/send-bill-to-party-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/utils/email-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { billToPartyEmail, billToPartyName, assetData } = body;

    if (!billToPartyEmail || !billToPartyName || !assetData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await emailService.sendBillToPartyFeeNotification(
      billToPartyEmail,
      billToPartyName,
      assetData
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending bill-to-party email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}