// src/app/api/bill-to-party-payments/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import { emailService } from "@/utils/email-service";

export async function POST(req: NextRequest) {
  try {
    console.log("=== Bill-to-Party Payment Tracking Cron Job ===");
    
    const now = new Date();
    
    // Find all unpaid bill-to-party payments
    const unpaidPayments = await prisma.billToPartyPayment.findMany({
      where: {
        isPaid: false,
      },
      include: {
        asset: {
          include: {
            billToParty: {
              include: {
                contact: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            bids: {
              where: {
                accepted: true,
                paymentApprovedByBuyer: true,
              },
              include: {
                buyer: true,
              },
            },
          },
        },
        billToParty: {
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

    console.log(`Found ${unpaidPayments.length} unpaid payments to process`);

    let remindersProcessed = 0;
    let overdueNotificationsProcessed = 0;

    for (const payment of unpaidPayments) {
      const dueDate = new Date(payment.dueDate);
      const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if payment is overdue
      if (now > dueDate && !payment.isOverdue) {
        console.log(`Payment ${payment.id} is now overdue`);
        
        await prisma.billToPartyPayment.update({
          where: { id: payment.id },
          data: { isOverdue: true },
        });
      }

      // Send overdue notification if payment is overdue and notification hasn't been sent
      if (payment.isOverdue && !payment.overdueNotificationSent) {
        console.log(`Sending overdue notification for payment ${payment.id}`);
        
        const acceptedBid = payment.asset.bids[0];
        if (acceptedBid) {
          try {
            await emailService.sendBillToPartyPaymentOverdueEmail({
              billToPartyEmail: payment.billToParty.email,
              billToPartyName: payment.billToParty.name,
              buyerName: acceptedBid.buyer.name,
              invoiceNumber: payment.asset.invoiceNumber,
              amountDue: payment.amountInCents / 100,
              dueDate: payment.dueDate.toISOString(),
              daysOverdue: Math.abs(daysSinceDue),
              assetId: payment.asset.id,
            });

            await prisma.billToPartyPayment.update({
              where: { id: payment.id },
              data: { overdueNotificationSent: true },
            });

            // Create notification
            const billToPartyUserId = payment.billToParty.contact?.userId;
            if (billToPartyUserId) {
              await prisma.notification.create({
                data: {
                  userId: billToPartyUserId,
                  type: "BILL_TO_PARTY_PAYMENT_OVERDUE",
                  title: "Payment Overdue",
                  message: `Your payment for invoice ${payment.asset.invoiceNumber} is overdue by ${Math.abs(daysSinceDue)} days.`,
                  assetId: payment.asset.id,
                  roleContext: "bill-to-party",
                },
              });
            }

            overdueNotificationsProcessed++;
          } catch (error) {
            console.error(`Failed to send overdue notification for payment ${payment.id}:`, error);
          }
        }
      }

      // Send reminders every 3 days if not overdue
      if (!payment.isOverdue && payment.nextReminderDueAt && now >= payment.nextReminderDueAt) {
        console.log(`Sending reminder for payment ${payment.id}`);
        
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const acceptedBid = payment.asset.bids[0];
        
        if (acceptedBid && daysUntilDue > 0) {
          try {
            await emailService.sendBillToPartyPaymentReminderEmail({
              billToPartyEmail: payment.billToParty.email,
              billToPartyName: payment.billToParty.name,
              buyerName: acceptedBid.buyer.name,
              invoiceNumber: payment.asset.invoiceNumber,
              amountDue: payment.amountInCents / 100,
              dueDate: payment.dueDate.toISOString(),
              daysUntilDue: daysUntilDue,
              reminderNumber: payment.remindersSent + 1,
              assetId: payment.asset.id,
            });

            // Calculate next reminder date (3 days from now)
            const nextReminder = new Date(now);
            nextReminder.setDate(nextReminder.getDate() + 3);

            await prisma.billToPartyPayment.update({
              where: { id: payment.id },
              data: {
                remindersSent: payment.remindersSent + 1,
                lastReminderSentAt: now,
                nextReminderDueAt: nextReminder,
              },
            });

            // Create notification
            const billToPartyUserId = payment.billToParty.contact?.userId;
            if (billToPartyUserId) {
              await prisma.notification.create({
                data: {
                  userId: billToPartyUserId,
                  type: "BILL_TO_PARTY_PAYMENT_REMINDER",
                  title: `Payment Reminder #${payment.remindersSent + 1}`,
                  message: `Reminder: Payment of €${(payment.amountInCents / 100).toFixed(2)} due in ${daysUntilDue} days for invoice ${payment.asset.invoiceNumber}.`,
                  assetId: payment.asset.id,
                  roleContext: "bill-to-party",
                },
              });
            }

            remindersProcessed++;
          } catch (error) {
            console.error(`Failed to send reminder for payment ${payment.id}:`, error);
          }
        }
      }
    }

    console.log(`✓ Processed ${remindersProcessed} reminders and ${overdueNotificationsProcessed} overdue notifications`);

    return NextResponse.json({
      success: true,
      processed: unpaidPayments.length,
      remindersProcessed,
      overdueNotificationsProcessed,
    });
  } catch (error) {
    console.error("Error tracking bill-to-party payments:", error);
    return NextResponse.json(
      { error: "Failed to track payments" },
      { status: 500 }
    );
  }
}