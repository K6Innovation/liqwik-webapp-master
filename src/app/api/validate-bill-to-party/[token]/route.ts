// src/app/api/validate-bill-to-party/[token]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import { NotificationService } from "@/utils/notification-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Find the asset with this validation token
    const asset = await prisma.asset.findFirst({
      where: {
        billToPartyValidationToken: token,
      },
      include: {
        seller: {
          include: {
            contact: {
              include: {
                user: true,
              },
            },
          },
        },
        billToParty: true,
      },
    });

    if (!asset) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Invalid Token - Liqwik</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #be185d, #9f1239);
              padding: 20px;
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 8px;
              box-shadow: 0 10px 30px rgba(190, 24, 93, 0.3);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .status-icon {
              width: 80px;
              height: 80px;
              margin: 0 auto 1.5rem;
              background: linear-gradient(135deg, #fecdd3, #fda4af);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2.5rem;
              color: #be185d;
              font-weight: bold;
            }
            h1 {
              color: #be185d;
              margin: 0 0 1rem 0;
              font-size: 1.75rem;
              font-weight: 600;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin: 0.5rem 0;
              font-size: 1rem;
            }
            .button {
              display: inline-block;
              margin-top: 2rem;
              padding: 0.875rem 2rem;
              background: linear-gradient(135deg, #be185d, #9f1239);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              transition: all 0.3s;
              font-weight: 600;
              font-size: 0.95rem;
              letter-spacing: 0.3px;
            }
            .button:hover {
              background: linear-gradient(135deg, #9f1239, #831843);
              box-shadow: 0 4px 12px rgba(190, 24, 93, 0.4);
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status-icon">✕</div>
            <h1>Invalid or Expired Token</h1>
            <p>This validation link is invalid or has already been used.</p>
            <p style="margin-top: 1rem; font-size: 0.875rem;">Please contact support if you believe this is an error.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Check if already validated
    if (asset.validatedByBillToParty) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Already Validated - Liqwik</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #be185d, #9f1239);
              padding: 20px;
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 8px;
              box-shadow: 0 10px 30px rgba(190, 24, 93, 0.3);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .status-icon {
              width: 80px;
              height: 80px;
              margin: 0 auto 1.5rem;
              background: linear-gradient(135deg, #d1fae5, #a7f3d0);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2.5rem;
              color: #059669;
              font-weight: bold;
            }
            h1 {
              color: #be185d;
              margin: 0 0 1rem 0;
              font-size: 1.75rem;
              font-weight: 600;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin: 0.5rem 0;
              font-size: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status-icon">✓</div>
            <h1>Already Validated</h1>
            <p>This asset has already been validated.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Update the asset to mark as validated by bill to party
    await prisma.asset.update({
      where: {
        id: asset.id,
      },
      data: {
        validatedByBillToParty: true,
        billToPartyValidatedAt: new Date(),
      },
    });

    // Send bell notification to seller about validation
    try {
      await NotificationService.notifyBillToPartyValidated(
        asset.seller.contact.user.id,
        asset,
        asset.billToParty.name
      );
      console.log(`Bell notification sent to seller ${asset.seller.contact.user.id} for bill to party validation`);
    } catch (notificationError) {
      console.error("Error sending validation notification:", notificationError);
      // Don't fail the validation if notification fails
    }

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Validation Successful - Liqwik</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #be185d, #9f1239);
            padding: 20px;
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(190, 24, 93, 0.3);
            text-align: center;
            max-width: 600px;
            width: 100%;
          }
          .success-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #d1fae5, #a7f3d0);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3.5rem;
            color: #059669;
            animation: scaleIn 0.5s ease-out;
            font-weight: bold;
          }
          @keyframes scaleIn {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          h1 {
            color: #be185d;
            margin: 0 0 1rem 0;
            font-size: 2rem;
            font-weight: 600;
          }
          .details {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
            border-radius: 6px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #374151;
            font-size: 0.95rem;
          }
          .value {
            color: #6b7280;
            font-size: 0.95rem;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin: 0.5rem 0;
            font-size: 1rem;
          }
          .footer-text {
            font-size: 0.875rem;
            color: #9ca3af;
            margin-top: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Validation Successful</h1>
          
          <p>Your validation has been recorded successfully. The seller has been notified.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Invoice Number</span>
              <span class="value">${asset.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="label">Validation Date & Time</span>
              <span class="value">${new Date().toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
          </div>
          
          <p class="footer-text">
            You can safely close this window.
          </p>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error validating by bill to party:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Error - Liqwik</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #be185d, #9f1239);
            padding: 20px;
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(190, 24, 93, 0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .status-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #fecdd3, #fda4af);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: #dc2626;
            font-weight: bold;
          }
          h1 {
            color: #dc2626;
            margin: 0 0 1rem 0;
            font-size: 1.75rem;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin: 0.5rem 0;
            font-size: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status-icon">!</div>
          <h1>Processing Error</h1>
          <p>An error occurred while processing your validation.</p>
          <p>Please try again or contact our support team for assistance.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}