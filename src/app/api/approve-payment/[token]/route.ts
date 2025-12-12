// src/app/api/approve-payment/[token]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import { emailService } from "@/utils/email-service";
import { NotificationService } from "@/utils/notification-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    console.log("=== Payment Approval Request ===");
    console.log("Token received:", token);
    console.log("Token length:", token.length);

    // Find the bid with this payment approval token
    const bid = await prisma.assetBid.findUnique({
      where: {
        paymentApprovalToken: token,
      },
      include: {
        asset: {
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
        },
        buyer: {
          include: {
            contact: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!bid) {
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
            @media (max-width: 600px) {
              .container {
                padding: 2rem 1.5rem;
              }
              h1 {
                font-size: 1.5rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status-icon">✕</div>
            <h1>Invalid Payment Link</h1>
            <p>The payment approval link is invalid or has expired.</p>
            <p style="margin-top: 1rem; font-size: 0.875rem;">Please contact support if you need assistance.</p>
            <a href="/" class="button">Return to Dashboard</a>
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

    // Check if payment was already approved
    if (bid.paymentApprovedByBuyer) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Already Approved - Liqwik</title>
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
            .info-box {
              background: #fce7f3;
              border-left: 4px solid #be185d;
              padding: 1rem 1.25rem;
              margin: 1.5rem 0;
              border-radius: 4px;
              text-align: left;
            }
            .info-box p {
              color: #9f1239;
              margin: 0;
              font-weight: 500;
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
            @media (max-width: 600px) {
              .container {
                padding: 2rem 1.5rem;
              }
              h1 {
                font-size: 1.5rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status-icon">✓</div>
            <h1>Payment Already Confirmed</h1>
            <p>This payment has already been confirmed on ${new Date(bid.paymentApprovedAt!).toLocaleDateString()}.</p>
            <div class="info-box">
              <p>No further action is needed. The contract has been processed.</p>
            </div>
            <a href="/" class="button">Return to Dashboard</a>
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

    // Check if payment deadline has passed
    if (bid.paymentDeadline && new Date() > new Date(bid.paymentDeadline)) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Deadline Passed - Liqwik</title>
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
              background: linear-gradient(135deg, #fed7aa, #fdba74);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2.5rem;
              color: #ea580c;
              font-weight: bold;
            }
            h1 {
              color: #ea580c;
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
            .warning-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 1rem 1.25rem;
              margin: 1.5rem 0;
              border-radius: 4px;
              text-align: left;
            }
            .warning-box p {
              color: #92400e;
              margin: 0;
              font-weight: 500;
            }
            .button {
              display: inline-block;
              margin-top: 2rem;
              padding: 0.875rem 2rem;
              background: #ea580c;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              transition: all 0.3s;
              font-weight: 600;
              font-size: 0.95rem;
              letter-spacing: 0.3px;
            }
            .button:hover {
              background: #c2410c;
              box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
              transform: translateY(-2px);
            }
            @media (max-width: 600px) {
              .container {
                padding: 2rem 1.5rem;
              }
              h1 {
                font-size: 1.5rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status-icon">!</div>
            <h1>Payment Deadline Passed</h1>
            <p>The 24-hour payment deadline has expired.</p>
            <div class="warning-box">
              <p>Please contact the seller to discuss next steps and alternative arrangements.</p>
            </div>
            <a href="/" class="button">Return to Dashboard</a>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Update the bid to mark payment as approved
    await prisma.assetBid.update({
      where: {
        id: bid.id,
      },
      data: {
        paymentApprovedByBuyer: true,
        paymentApprovedAt: new Date(),
      },
    });

    const bidAmount = (bid.numUnits * bid.centsPerUnit) / 100;
    const faceValue = bid.asset.faceValueInCents / 100;
    const confirmedAt = new Date().toISOString();

    console.log("=== Sending Payment Confirmation Emails ===");
    console.log("Buyer Email:", bid.buyer.contact.user.email);
    console.log("Seller Email:", bid.asset.seller.contact.user.email);

    // Send payment confirmation email to buyer
    try {
      await emailService.sendPaymentConfirmationEmail({
        buyerEmail: bid.buyer.contact.user.email,
        buyerName: bid.buyer.name,
        sellerName: bid.asset.seller.name,
        invoiceNumber: bid.asset.invoiceNumber,
        faceValue,
        bidAmount,
        invoiceDate: bid.asset.invoiceDate.toISOString(),
        paymentDate: bid.asset.paymentDate.toISOString(),
        confirmedAt,
        bidId: bid.id,
      });

      // Mark buyer email as sent
      await prisma.assetBid.update({
        where: {
          id: bid.id,
        },
        data: {
          paymentConfirmationEmailSent: true,
        },
      });
      
      console.log(`✓ Payment confirmation email sent to buyer: ${bid.buyer.contact.user.email}`);
    } catch (emailError) {
      console.error("✗ Failed to send payment confirmation email to buyer:", emailError);
      // Don't fail the request if email fails - payment is still confirmed
    }

    // Send payment notification email to seller
    try {
      await emailService.sendSellerPaymentNotificationEmail({
        sellerEmail: bid.asset.seller.contact.user.email,
        sellerName: bid.asset.seller.name,
        buyerName: bid.buyer.name,
        invoiceNumber: bid.asset.invoiceNumber,
        faceValue,
        bidAmount,
        invoiceDate: bid.asset.invoiceDate.toISOString(),
        paymentDate: bid.asset.paymentDate.toISOString(),
        confirmedAt,
        bidId: bid.id,
      });

      // Mark seller notification email as sent
      await prisma.assetBid.update({
        where: {
          id: bid.id,
        },
        data: {
          sellerPaymentNotificationSent: true,
        },
      });
      
      console.log(`✓ Payment notification email sent to seller: ${bid.asset.seller.contact.user.email}`);
    } catch (emailError) {
      console.error("✗ Failed to send payment notification email to seller:", emailError);
      // Don't fail the request if email fails - payment is still confirmed
    }

    // Send bell notifications to both buyer and seller
    try {
      await NotificationService.notifyPaymentMade(
        bid.buyer.contact.user.id,
        bid.asset.seller.contact.user.id,
        bid.asset,
        bid
      );
      console.log(`✓ Bell notifications sent to buyer ${bid.buyer.contact.user.id} and seller ${bid.asset.seller.contact.user.id}`);
    } catch (notificationError) {
      console.error("✗ Failed to send payment notifications:", notificationError);
      // Don't fail the request if notification fails
    }

    console.log("=== Payment Approval Complete ===");

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Payment Confirmed - Liqwik</title>
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
          p {
            color: #6b7280;
            line-height: 1.6;
            margin: 0.5rem 0;
            font-size: 1rem;
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
          .email-notice {
            background: #d1fae5;
            border-left: 4px solid #059669;
            padding: 1.25rem;
            margin: 1.5rem 0;
            border-radius: 4px;
            text-align: left;
          }
          .email-notice strong {
            color: #065f46;
            display: block;
            margin-bottom: 0.5rem;
          }
          .email-notice p {
            color: #047857;
            margin: 0.25rem 0;
            font-size: 0.9rem;
          }
          .footer-text {
            font-size: 0.875rem;
            color: #9ca3af;
            margin-top: 1.5rem;
          }
          @media (max-width: 600px) {
            .container {
              padding: 2rem 1.5rem;
            }
            h1 {
              font-size: 1.5rem;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              font-size: 3rem;
            }
            .detail-row {
              flex-direction: column;
              gap: 0.25rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Payment Confirmed Successfully</h1>
          <p>Thank you for confirming your payment. The seller has been notified.</p>
          
          <div class="email-notice">
            <strong>Confirmation Emails Sent</strong>
            <p>✓ Payment confirmation sent to your email address</p>
            <p>✓ Payment notification sent to the seller</p>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Invoice Number</span>
              <span class="value">${bid.asset.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="label">Seller Name</span>
              <span class="value">${bid.asset.seller.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Amount</span>
              <span class="value">€${bidAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Confirmation Date & Time</span>
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
            You can now view the updated status in your Liqwik dashboard.
          </p>
          
          <a href="/" class="button">Go to Dashboard</a>
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
    console.error("Error approving payment:", error);
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
          .error-box {
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 1rem 1.25rem;
            margin: 1.5rem 0;
            border-radius: 4px;
            text-align: left;
          }
          .error-box p {
            color: #991b1b;
            margin: 0;
            font-weight: 500;
          }
          .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.875rem 2rem;
            background: #dc2626;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: all 0.3s;
            font-weight: 600;
            font-size: 0.95rem;
            letter-spacing: 0.3px;
          }
          .button:hover {
            background: #b91c1c;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
            transform: translateY(-2px);
          }
          @media (max-width: 600px) {
            .container {
              padding: 2rem 1.5rem;
            }
            h1 {
              font-size: 1.5rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status-icon">!</div>
          <h1>Server Error</h1>
          <p>An unexpected error occurred while processing your payment confirmation.</p>
          <div class="error-box">
            <p>Please try again or contact support for assistance.</p>
          </div>
          <a href="/" class="button">Return to Dashboard</a>
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