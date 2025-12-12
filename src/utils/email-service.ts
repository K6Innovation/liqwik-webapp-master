// src/utils/email-service.ts

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface AssetData {
  invoiceNumber: string;
  feeAmount: string;
  paymentDate: string;
}

interface SellerAssetData extends AssetData {
  id: string;
  faceValue: number;
  feeApprovalToken: string;
}

interface FeeConfirmationData {
  invoiceNumber: string;
  feeAmount: string;
  faceValue: number;
  paymentDate: string;
  approvedAt: string;
}

interface BidAcceptedEmailData {
  buyerEmail: string;
  buyerName: string;
  sellerName: string;
  invoiceNumber: string;
  faceValue: number;
  bidAmount: number;
  discount: number;
  paymentDeadline: Date;
  invoiceDate: string;
  paymentDate: string;
  paymentApprovalToken: string;
  bidId: string;
}

interface PaymentConfirmationEmailData {
  buyerEmail: string;
  buyerName: string;
  sellerName: string;
  invoiceNumber: string;
  faceValue: number;
  bidAmount: number;
  invoiceDate: string;
  paymentDate: string;
  confirmedAt: string;
  bidId: string;
}

interface SellerPaymentNotificationEmailData {
  sellerEmail: string;
  sellerName: string;
  buyerName: string;
  invoiceNumber: string;
  faceValue: number;
  bidAmount: number;
  invoiceDate: string;
  paymentDate: string;
  confirmedAt: string;
  bidId: string;
}

interface AssetPostedEmailData {
  sellerEmail: string;
  sellerName: string;
  invoiceNumber: string;
  faceValue: number;
  feeAmount: string;
  paymentDate: string;
  postedAt: string;
  assetId: string;
}

interface AssetCancelledEmailData {
  sellerEmail: string;
  sellerName: string;
  invoiceNumber: string;
  faceValue: number;
  cancelledAt: string;
  assetId: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    const emailService = process.env.EMAIL_SERVICE;

    switch (emailService) {
      case "gmail":
        return nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

      case "sendgrid":
        return nodemailer.createTransport({
          service: "SendGrid",
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
        });

      case "custom":
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

      default:
        throw new Error("Email service not configured");
    }
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendVerificationEmail(
    email: string,
    code: string,
    firstName?: string
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const subject = `Verify your ${appName} account - Verification Code: ${code}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - ${appName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .email-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #be185d;
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.95;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #111827;
            font-weight: 500;
          }
          .intro-text {
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .verification-section {
            background: #fdf2f8;
            border: 2px solid #be185d;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .verification-title {
            color: #831843;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .verification-code {
            font-size: 36px;
            font-weight: 700;
            color: #be185d;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 20px 30px;
            border-radius: 6px;
            border: 2px solid #be185d;
            display: inline-block;
            margin: 15px 0;
          }
          .expiry-info {
            color: #9f1239;
            font-size: 13px;
            margin-top: 15px;
            font-weight: 500;
          }
          .instructions {
            background: #f9fafb;
            border-left: 4px solid #be185d;
            padding: 20px 25px;
            margin: 30px 0;
            border-radius: 0 4px 4px 0;
          }
          .instructions-title {
            color: #831843;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 15px;
          }
          .instructions ol {
            margin: 0;
            padding-left: 20px;
            color: #4b5563;
          }
          .instructions li {
            margin-bottom: 8px;
          }
          .security-note {
            background: #fef9c3;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
          }
          .security-title {
            color: #854d0e;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .security-note p {
            margin: 0;
            color: #713f12;
            font-size: 14px;
          }
          .footer {
            background: #831843;
            color: #fce7f3;
            padding: 30px;
            text-align: center;
          }
          .footer-content {
            font-size: 14px;
            line-height: 1.6;
          }
          .company-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .company-tagline {
            font-size: 13px;
            opacity: 0.9;
            margin-bottom: 20px;
          }
          .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            color: #fbcfe8;
            font-size: 13px;
          }
          .company-info div {
            margin: 5px 0;
          }
          .footer-legal {
            margin-top: 20px;
            font-size: 11px;
            opacity: 0.8;
            line-height: 1.5;
          }
          .support-text {
            color: #6b7280;
            margin-top: 30px;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .content, .header, .footer {
              padding: 25px 20px;
            }
            .verification-code {
              font-size: 28px;
              letter-spacing: 4px;
              padding: 15px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Two-Factor Authentication</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${firstName || "Valued User"},
            </div>
            
            <p class="intro-text">
              Welcome to <strong>${appName}</strong>. To complete your registration and secure your account, please verify your email address using the verification code provided below.
            </p>
            
            <div class="verification-section">
              <div class="verification-title">Verification Code</div>
              <div class="verification-code">${code}</div>
              <div class="expiry-info">Valid for 1 hour from time of receipt</div>
            </div>
            
            <div class="instructions">
              <div class="instructions-title">Verification Instructions</div>
              <ol>
                <li>Navigate to the verification page on ${appName}</li>
                <li>Enter the 6-digit verification code displayed above</li>
                <li>Click "Verify Email" to complete your registration process</li>
              </ol>
            </div>
            
            <div class="security-note">
              <div class="security-title">Security Notice</div>
              <p>If you did not create an account with ${appName}, please disregard this email. Your security is our priority, and no account will be created without proper email verification.</p>
            </div>
            
            <p class="support-text">
              Should you require assistance, please contact our support team. We are here to help.
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <div class="company-name">${appName}</div>
              <div class="company-tagline">Secure Financial Platform</div>
              <div class="company-info">
                <div>${companyLocation}</div>
                <div>support@liqwik.com</div>
                <div>${appUrl}</div>
              </div>
              <div class="footer-legal">
                &copy; 2024 ${appName}. All rights reserved.<br>
                This is an automated message. Please do not reply to this email.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Dear ${firstName || "Valued User"},
      
      Welcome to ${appName}. To complete your registration and secure your account, please verify your email address using the verification code provided below.
      
      Verification Code: ${code}
      
      This code is valid for 1 hour from time of receipt.
      
      Verification Instructions:
      1. Navigate to the verification page on ${appName}
      2. Enter the 6-digit verification code displayed above
      3. Click "Verify Email" to complete your registration process
      
      Security Notice: If you did not create an account with ${appName}, please disregard this email.
      
      Should you require assistance, please contact our support team at support@liqwik.com
      
      ${appName}
      ${companyLocation}
      ${appUrl}
      
      © 2024 ${appName}. All rights reserved.
      This is an automated message. Please do not reply to this email.
    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendLoginOtpEmail(
    email: string,
    otp: string,
    firstName?: string
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const subject = `${appName} Login Verification - OTP: ${otp}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Verification - ${appName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .email-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #be185d;
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.95;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #111827;
            font-weight: 500;
          }
          .intro-text {
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .otp-section {
            background: #fdf2f8;
            border: 2px solid #be185d;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-title {
            color: #831843;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #be185d;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 20px 30px;
            border-radius: 6px;
            border: 2px solid #be185d;
            display: inline-block;
            margin: 15px 0;
          }
          .expiry-info {
            color: #9f1239;
            font-size: 13px;
            margin-top: 15px;
            font-weight: 500;
          }
          .instructions {
            background: #f9fafb;
            border-left: 4px solid #be185d;
            padding: 20px 25px;
            margin: 30px 0;
            border-radius: 0 4px 4px 0;
          }
          .instructions-title {
            color: #831843;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 15px;
          }
          .instructions ol {
            margin: 0;
            padding-left: 20px;
            color: #4b5563;
          }
          .instructions li {
            margin-bottom: 8px;
          }
          .security-alert {
            background: #fef2f2;
            border: 2px solid #dc2626;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
          }
          .alert-title {
            color: #991b1b;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .security-alert p {
            margin: 0;
            color: #7f1d1d;
            font-size: 14px;
          }
          .footer {
            background: #831843;
            color: #fce7f3;
            padding: 30px;
            text-align: center;
          }
          .footer-content {
            font-size: 14px;
            line-height: 1.6;
          }
          .company-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .company-tagline {
            font-size: 13px;
            opacity: 0.9;
            margin-bottom: 20px;
          }
          .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            color: #fbcfe8;
            font-size: 13px;
          }
          .company-info div {
            margin: 5px 0;
          }
          .footer-legal {
            margin-top: 20px;
            font-size: 11px;
            opacity: 0.8;
            line-height: 1.5;
          }
          .support-text {
            color: #6b7280;
            margin-top: 30px;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .content, .header, .footer {
              padding: 25px 20px;
            }
            .otp-code {
              font-size: 28px;
              letter-spacing: 4px;
              padding: 15px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Login Verification</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${firstName || "Valued User"},
            </div>
            
            <p class="intro-text">
              A login attempt has been detected on your <strong>${appName}</strong> account. For your security, please use the verification code below to complete your login process.
            </p>
            
            <div class="otp-section">
              <div class="otp-title">Login Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="expiry-info">Valid for 10 minutes from time of receipt</div>
            </div>
            
            <div class="instructions">
              <div class="instructions-title">Authentication Instructions</div>
              <ol>
                <li>Return to the ${appName} login page</li>
                <li>Enter the 6-digit verification code displayed above</li>
                <li>Click "Verify & Login" to access your account</li>
              </ol>
            </div>
            
            <div class="security-alert">
              <div class="alert-title">Security Alert</div>
              <p>If you did not attempt to log in to ${appName}, please disregard this email and consider changing your password immediately. This verification code will expire automatically.</p>
            </div>
            
            <p class="support-text">
              For additional security concerns or if you are experiencing difficulties logging in, please contact our support team immediately.
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <div class="company-name">${appName}</div>
              <div class="company-tagline">Secure Financial Platform</div>
              <div class="company-info">
                <div>${companyLocation}</div>
                <div>support@liqwik.com</div>
                <div>${appUrl}</div>
              </div>
              <div class="footer-legal">
                &copy; 2024 ${appName}. All rights reserved.<br>
                This is an automated message. Please do not reply to this email.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Dear ${firstName || "Valued User"},
      
      A login attempt has been detected on your ${appName} account. For your security, please use the verification code below to complete your login process.
      
      Login Verification Code: ${otp}
      
      This code is valid for 10 minutes from time of receipt.
      
      Authentication Instructions:
      1. Return to the ${appName} login page
      2. Enter the 6-digit verification code displayed above
      3. Click "Verify & Login" to access your account
      
      Security Alert: If you did not attempt to log in to ${appName}, please disregard this email and consider changing your password immediately.
      
      For additional security concerns or if you are experiencing difficulties logging in, please contact our support team at support@liqwik.com
      
      ${appName}
      ${companyLocation}
      ${appUrl}
      
      © 2024 ${appName}. All rights reserved.
      This is an automated message. Please do not reply to this email.
    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendFirstLoginSuccessEmail(
    email: string,
    firstName?: string,
    selectedRole?: string
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const subject = `Welcome to ${appName} - First Login Successful`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>First Login Success - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          overflow: hidden;
        }
        .header {
          background: #be185d;
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 12px 0 0 0;
          font-size: 15px;
          opacity: 0.95;
          font-weight: 400;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #111827;
          font-weight: 500;
        }
        .main-text {
          color: #374151;
          margin-bottom: 28px;
          font-size: 15px;
        }
        .details-box {
          background: #fdf2f8;
          border: 1px solid #f9a8d4;
          border-radius: 4px;
          padding: 24px;
          margin: 28px 0;
        }
        .details-title {
          color: #831843;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-table td {
          padding: 10px 0;
          font-size: 14px;
        }
        .details-table .label {
          font-weight: 600;
          color: #4b5563;
          width: 35%;
        }
        .details-table .value {
          color: #6b7280;
        }
        .role-badge {
          display: inline-block;
          background: #be185d;
          color: white;
          padding: 6px 14px;
          border-radius: 3px;
          font-weight: 500;
          text-transform: capitalize;
          font-size: 13px;
          letter-spacing: 0.3px;
        }
        .info-section {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 28px 0;
        }
        .info-title {
          color: #78350f;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-text {
          margin: 0;
          color: #92400e;
          font-size: 14px;
          line-height: 1.6;
        }
        .next-steps {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 24px;
          margin: 28px 0;
          border-radius: 4px;
        }
        .next-steps-title {
          color: #111827;
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .step-item {
          padding: 10px 0;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
          line-height: 1.5;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .cta-section {
          text-align: center;
          margin: 32px 0;
        }
        .cta-button {
          display: inline-block;
          background: #be185d;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 15px;
          letter-spacing: 0.3px;
        }
        .support-info {
          background: #f9fafb;
          padding: 20px;
          margin-top: 32px;
          text-align: center;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .support-text {
          color: #6b7280;
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        .support-email {
          color: #be185d;
          font-weight: 600;
          text-decoration: none;
        }
        .footer {
          background: #831843;
          color: #fce7f3;
          padding: 30px;
          text-align: center;
        }
        .footer-content {
          font-size: 13px;
          line-height: 1.6;
        }
        .company-name {
          font-weight: 600;
          color: white;
          margin-bottom: 16px;
        }
        .company-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #9d174d;
          color: #fbcfe8;
          font-size: 13px;
          line-height: 1.8;
        }
        .copyright {
          margin-top: 16px;
          font-size: 12px;
          color: #f9a8d4;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 24px 20px;
          }
          .cta-button {
            display: block;
            margin: 10px auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p>First Login Confirmation</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${firstName || "Valued User"},
          </div>
          
          <p class="main-text">
            We are pleased to confirm that you have successfully logged into your ${appName} account for the first time. Your account is now active and ready to use.
          </p>
          
          <div class="details-box">
            <div class="details-title">Login Confirmation Details</div>
            <table class="details-table">
              <tr>
                <td class="label">Email Address:</td>
                <td class="value">${email}</td>
              </tr>
              ${
                selectedRole
                  ? `<tr>
                <td class="label">Account Role:</td>
                <td class="value"><span class="role-badge">${selectedRole}</span></td>
              </tr>`
                  : ""
              }
              <tr>
                <td class="label">Login Date:</td>
                <td class="value">${new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</td>
              </tr>
              <tr>
                <td class="label">Login Time:</td>
                <td class="value">${new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}</td>
              </tr>
            </table>
          </div>
          
          <div class="next-steps">
            <div class="next-steps-title">Recommended Next Steps</div>
            <ul class="steps-list">
              <li class="step-item">Complete your profile information to personalize your experience</li>
              <li class="step-item">Review available platform features and tools</li>
              <li class="step-item">Configure your account preferences and settings</li>
              <li class="step-item">Begin managing your transactions securely</li>
            </ul>
          </div>
          
          <div class="info-section">
            <div class="info-title">Security Enhancement Notice</div>
            <p class="info-text">
              For enhanced security, all subsequent login attempts will require One-Time Password (OTP) verification sent to your registered email address. This additional security measure ensures that only authorized users can access your account.
            </p>
          </div>
          
          <div class="cta-section">
            <a href="${appUrl}" class="cta-button">Access Your Dashboard</a>
          </div>
          
          <div class="support-info">
            <p class="support-text">
              Should you require assistance, our support team is available to help.
            </p>
            <p class="support-text">
              <strong>Email:</strong> <a href="mailto:support@liqwik.com" class="support-email">support@liqwik.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="company-name">${appName}</div>
            <div>Secure Financial Platform</div>
            <div class="company-info">
              ${companyLocation}<br>
              support@liqwik.com<br>
              ${appUrl}
            </div>
            <div class="copyright">
              &copy; 2024 ${appName}. All rights reserved.<br>
              This is an automated message. Please do not reply to this email.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Dear ${firstName || "Valued User"},
    
    We are pleased to confirm that you have successfully logged into your ${appName} account for the first time. Your account is now active and ready to use.
    
    LOGIN CONFIRMATION DETAILS
    Email Address: ${email}
    ${selectedRole ? `Account Role: ${selectedRole}` : ""}
    Login Date: ${new Date().toLocaleDateString()}
    Login Time: ${new Date().toLocaleTimeString()}
    
    RECOMMENDED NEXT STEPS
    - Complete your profile information to personalize your experience
    - Review available platform features and tools
    - Configure your account preferences and settings
    - Begin managing your transactions securely
    
    SECURITY ENHANCEMENT NOTICE
    For enhanced security, all subsequent login attempts will require One-Time Password (OTP) verification sent to your registered email address.
    
    Access Your Dashboard: ${appUrl}
    
    Should you require assistance, our support team is available to help.
    Email: support@liqwik.com
    
    ${appName}
    ${companyLocation}
    ${appUrl}
    
    © 2024 ${appName}. All rights reserved.
  `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const subject = `Welcome to ${appName}`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          overflow: hidden;
        }
        .header {
          background: #be185d;
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 12px 0 0 0;
          font-size: 15px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #111827;
          font-weight: 500;
        }
        .main-text {
          color: #374151;
          margin-bottom: 28px;
          font-size: 15px;
        }
        .next-steps {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 24px;
          margin: 28px 0;
          border-radius: 4px;
        }
        .next-steps-title {
          color: #111827;
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .step-item {
          padding: 10px 0;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .cta-section {
          text-align: center;
          margin: 32px 0;
        }
        .cta-button {
          display: inline-block;
          background: #be185d;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 15px;
          letter-spacing: 0.3px;
        }
        .support-info {
          background: #fdf2f8;
          border: 1px solid #f9a8d4;
          padding: 20px;
          margin-top: 32px;
          text-align: center;
          border-radius: 4px;
        }
        .support-text {
          color: #6b7280;
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        .support-email {
          color: #be185d;
          font-weight: 600;
          text-decoration: none;
        }
        .footer {
          background: #831843;
          color: #fce7f3;
          padding: 30px;
          text-align: center;
        }
        .footer-content {
          font-size: 13px;
          line-height: 1.6;
        }
        .company-name {
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
        }
        .copyright {
          margin-top: 16px;
          font-size: 12px;
          color: #f9a8d4;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 24px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Registration Successful</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${firstName || "Valued User"},
          </div>
          
          <p class="main-text">
            Thank you for registering with ${appName}. Your account has been successfully created and verified. We are pleased to have you join our platform.
          </p>
          
          <div class="next-steps">
            <div class="next-steps-title">Getting Started</div>
            <ul class="steps-list">
              <li class="step-item">Complete your profile setup for a personalized experience</li>
              <li class="step-item">Explore our comprehensive platform features and tools</li>
              <li class="step-item">Begin your journey with ${appName}</li>
            </ul>
          </div>
          
          <div class="cta-section">
            <a href="${appUrl}/auth/login" class="cta-button">Login to Your Account</a>
          </div>
          
          <p class="main-text">
            Should you have any questions or require assistance, our support team is available to help you.
          </p>
          
          <div class="support-info">
            <p class="support-text">
              <strong>Contact Support:</strong>
            </p>
            <p class="support-text">
              <a href="mailto:support@liqwik.com" class="support-email">support@liqwik.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="company-name">${appName}</div>
            <div class="copyright">
              &copy; 2024 ${appName}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Dear ${firstName || "Valued User"},
    
    Thank you for registering with ${appName}. Your account has been successfully created and verified.
    
    GETTING STARTED
    - Complete your profile setup for a personalized experience
    - Explore our comprehensive platform features and tools
    - Begin your journey with ${appName}
    
    You can login to your account at: ${appUrl}/auth/login
    
    Should you have any questions or require assistance, our support team is available to help you.
    Contact Support: support@liqwik.com
    
    © 2024 ${appName}. All rights reserved.
  `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendSellerFeeConfirmationEmail(
  email: string,
  sellerName: string,
  data: {
    invoiceNumber: string;
    feeAmount: string;
    faceValue: number;
    paymentDate: string;
    approvedAt: string;
  }
): Promise<void> {
  const appName = process.env.APP_NAME || "Liqwik";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const companyLocation = process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

  const subject = `${appName} - Fee Approved for Invoice ${data.invoiceNumber}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fee Approved - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fdf2f8;
        }
        .email-container {
          background: white;
          border-radius: 0;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(190, 24, 93, 0.1);
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 35px 40px;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 26px;
          font-weight: 600;
        }
        .content {
          padding: 40px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #111827;
          font-weight: 500;
        }
        .success-banner {
          background: linear-gradient(135deg, #fdf2f8, #fce7f3);
          border: 2px solid #be185d;
          border-radius: 4px;
          padding: 32px;
          text-align: center;
          margin: 32px 0;
        }
        .success-title {
          color: #831843;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 10px 0;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .details-table .label {
          font-weight: 600;
          color: #374151;
          width: 50%;
        }
        .details-table .value {
          color: #6b7280;
          text-align: right;
          font-weight: 500;
        }
        .footer {
          background: #1f2937;
          color: #d1d5db;
          padding: 32px 40px;
          border-top: 4px solid #be185d;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Fee Payment Confirmation</p>
        </div>
        
        <div class="content">
          <div class="greeting">Dear ${sellerName},</div>
          
          <div class="success-banner">
            <div class="success-title">Fee Payment Approved</div>
          </div>
          
          <p>Your fee payment has been confirmed. The next step is to request validation from the Bill-To Party.</p>
          
          <table class="details-table">
            <tr>
              <td class="label">Invoice Number:</td>
              <td class="value">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td class="label">Face Value:</td>
              <td class="value">€${data.faceValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Fee Amount:</td>
              <td class="value">€${data.feeAmount}</td>
            </tr>
            <tr>
              <td class="label">Approved At:</td>
              <td class="value">${new Date(data.approvedAt).toLocaleString()}</td>
            </tr>
          </table>
          
          <p>Please proceed to your dashboard and click the "Validate" button to send a validation request to the Bill-To Party.</p>
          
          <p style="color: #6b7280; margin-top: 32px;">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <div>${companyLocation}</div>
          <div>support@liqwik.com</div>
          <div>${appUrl}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Dear ${sellerName},
    
    Your fee payment has been confirmed for invoice ${data.invoiceNumber}.
    
    Face Value: €${data.faceValue.toFixed(2)}
    Fee Amount: €${data.feeAmount}
    
    Please proceed to your dashboard and click the "Validate" button to send a validation request to the Bill-To Party.
    
    Best regards,
    The ${appName} Team
  `;

  await this.sendEmail({ to: email, subject, html, text });
  }
// New method: Send bill to party validation request email
async sendBillToPartyValidationEmail(
  email: string,
  billToPartyName: string,
  sellerName: string,
  assetData: {
    invoiceNumber: string;
    faceValue: number;
    feeAmount: string;
    paymentDate: string;
    validationToken: string;
  }
): Promise<void> {
  const appName = process.env.APP_NAME || "Liqwik";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const companyLocation = process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

  const validationUrl = `${appUrl}/api/validate-bill-to-party/${assetData.validationToken}`;

  const subject = `${appName} - Validation Required for Invoice ${assetData.invoiceNumber}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Validation Required - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fdf2f8;
        }
        .email-container {
          background: white;
          border-radius: 0;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(190, 24, 93, 0.1);
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 35px 40px;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 26px;
          font-weight: 600;
        }
        .content {
          padding: 40px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #111827;
          font-weight: 500;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: #fafafa;
          border: 1px solid #e5e7eb;
          padding: 20px;
        }
        .details-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .details-table .label {
          font-weight: 600;
          color: #374151;
          width: 50%;
        }
        .details-table .value {
          color: #6b7280;
          font-weight: 500;
        }
        .validation-button {
          text-align: center;
          margin: 36px 0;
        }
        .validate-btn {
          display: inline-block;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 16px 48px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 16px;
          text-transform: uppercase;
        }
        .footer {
          background: #1f2937;
          color: #d1d5db;
          padding: 32px 40px;
          border-top: 4px solid #be185d;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Validation Required</p>
        </div>
        
        <div class="content">
          <div class="greeting">Dear ${billToPartyName},</div>
          
          <p>${sellerName} has requested your validation for an invoice that has been tokenized on our platform.</p>
          
          <table class="details-table">
            <tr>
              <td class="label">Invoice Number:</td>
              <td class="value">${assetData.invoiceNumber}</td>
            </tr>
            <tr>
              <td class="label">Face Value:</td>
              <td class="value">€${assetData.faceValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Processing Fee:</td>
              <td class="value">€${assetData.feeAmount}</td>
            </tr>
            <tr>
              <td class="label">Payment Due Date:</td>
              <td class="value">${new Date(assetData.paymentDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td class="label">Seller:</td>
              <td class="value">${sellerName}</td>
            </tr>
          </table>
          
          <div class="validation-button">
            <a href="${validationUrl}" class="validate-btn">
              Validate Invoice
            </a>
          </div>
          
          <p style="margin-top: 32px; color: #6b7280;">
            By clicking the "Validate Invoice" button, you confirm the details of this invoice are accurate.
          </p>
          
          <p style="color: #6b7280; margin-top: 32px;">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <div>${companyLocation}</div>
          <div>support@liqwik.com</div>
          <div>${appUrl}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Dear ${billToPartyName},
    
    ${sellerName} has requested your validation for invoice ${assetData.invoiceNumber}.
    
    Invoice Number: ${assetData.invoiceNumber}
    Face Value: €${assetData.faceValue.toFixed(2)}
    Processing Fee: €${assetData.feeAmount}
    Payment Due Date: ${new Date(assetData.paymentDate).toLocaleDateString()}
    Seller: ${sellerName}
    
    To validate this invoice, please visit:
    ${validationUrl}
    
    Best regards,
    The ${appName} Team
  `;

  await this.sendEmail({ to: email, subject, html, text });
}

  async sendBillToPartyFeeNotification(
    email: string,
    billToPartyName: string,
    assetData: AssetData
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const subject = `${appName} - Fee Notification for Invoice ${assetData.invoiceNumber}`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fee Notification - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          overflow: hidden;
        }
        .header {
          background: #be185d;
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 12px 0 0 0;
          font-size: 15px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #111827;
          font-weight: 500;
        }
        .main-text {
          color: #374151;
          margin-bottom: 28px;
          font-size: 15px;
          line-height: 1.7;
        }
        .invoice-details {
          background: #fdf2f8;
          border: 1px solid #f9a8d4;
          border-radius: 4px;
          padding: 24px;
          margin: 28px 0;
        }
        .details-title {
          color: #831843;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #fce7f3;
          font-size: 14px;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          font-weight: 600;
          color: #4b5563;
          width: 45%;
        }
        .details-table .value {
          color: #6b7280;
        }
        .fee-highlight {
          color: #be185d;
          font-weight: 600;
        }
        .info-section {
          background: #f0fdf4;
          border-left: 4px solid #10b981;
          padding: 20px;
          margin: 28px 0;
        }
        .info-title {
          color: #065f46;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-text {
          margin: 0;
          color: #047857;
          font-size: 14px;
          line-height: 1.6;
        }
        .closing-text {
          color: #4b5563;
          margin-top: 32px;
          font-size: 14px;
          line-height: 1.7;
        }
        .signature {
          color: #1f2937;
          margin-top: 24px;
          font-size: 14px;
        }
        .signature strong {
          color: #be185d;
        }
        .footer {
          background: #831843;
          color: #fce7f3;
          padding: 30px;
          text-align: center;
        }
        .footer-content {
          font-size: 13px;
          line-height: 1.6;
        }
        .company-name {
          font-weight: 600;
          color: white;
          margin-bottom: 16px;
        }
        .company-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #9d174d;
          color: #fbcfe8;
          font-size: 13px;
          line-height: 1.8;
        }
        .copyright {
          margin-top: 16px;
          font-size: 12px;
          color: #f9a8d4;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 24px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Processing Fee Notification</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${billToPartyName},
          </div>
          
          <p class="main-text">
            We trust this message finds you well. We are writing to inform you of a processing fee associated with your invoice that has been successfully tokenized on our platform.
          </p>
          
          <div class="invoice-details">
            <div class="details-title">Invoice Information</div>
            <table class="details-table">
              <tr>
                <td class="label">Invoice Number:</td>
                <td class="value">${assetData.invoiceNumber}</td>
              </tr>
              <tr>
                <td class="label">Payment Due Date:</td>
                <td class="value">${new Date(
                  assetData.paymentDate
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</td>
              </tr>
              <tr>
                <td class="label">Processing Fee Amount:</td>
                <td class="value"><span class="fee-highlight">€${
                  assetData.feeAmount
                }</span></td>
              </tr>
              <tr>
                <td class="label">Fee Percentage:</td>
                <td class="value">1% of invoice value</td>
              </tr>
            </table>
          </div>
          
          <div class="info-section">
            <div class="info-title">Fee Structure Information</div>
            <p class="info-text">
              This processing fee covers the operational costs associated with tokenizing and processing your invoice on our secure platform. The tokenization process facilitates enhanced payment processing efficiency and security. Should you have any questions regarding this fee structure or the tokenization process, please do not hesitate to contact our support team.
            </p>
          </div>
          
          <p class="closing-text">
            We appreciate your understanding and continued partnership. For any inquiries or clarifications regarding this notification, please contact our support team at support@liqwik.com or visit our website at ${appUrl}.
          </p>
          
          <p class="signature">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="company-name">${appName}</div>
            <div>Secure Financial Platform</div>
            <div class="company-info">
              ${companyLocation}<br>
              support@liqwik.com<br>
              ${appUrl}
            </div>
            <div class="copyright">
              &copy; 2024 ${appName}. All rights reserved.<br>
              This is an automated message. Please do not reply to this email.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Dear ${billToPartyName},
    
    We trust this message finds you well. We are writing to inform you of a processing fee associated with your invoice that has been successfully tokenized on our platform.
    
    INVOICE INFORMATION
    Invoice Number: ${assetData.invoiceNumber}
    Payment Due Date: ${new Date(assetData.paymentDate).toLocaleDateString()}
    Processing Fee Amount: €${assetData.feeAmount}
    Fee Percentage: 1% of invoice value
    
    FEE STRUCTURE INFORMATION
    This processing fee covers the operational costs associated with tokenizing and processing your invoice on our secure platform.
    
    For any inquiries, please contact our support team at support@liqwik.com
    
    Best regards,
    The ${appName} Team
    
    ${appName}
    ${companyLocation}
    ${appUrl}
    
    © 2024 ${appName}. All rights reserved.
  `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendSellerFeeApprovalEmail(
    email: string,
    sellerName: string,
    assetData: SellerAssetData
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const approvalUrl = `${appUrl}/api/approve-fee/${assetData.feeApprovalToken}`;

    const subject = `${appName} - Fee Payment Approval Required for Invoice ${assetData.invoiceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fee Approval - ${appName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 650px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fdf2f8;
          }
          .email-container {
            background: white;
            border-radius: 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(190, 24, 93, 0.1);
            border: 1px solid #e5e7eb;
          }
          .header {
            background: linear-gradient(135deg, #be185d, #9f1239);
            color: white;
            padding: 35px 40px;
            border-bottom: 4px solid #831843;
          }
          .header h1 {
            margin: 0 0 8px 0;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 0;
            font-size: 15px;
            opacity: 0.95;
            font-weight: 400;
          }
          .content {
            padding: 40px;
            background: #ffffff;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 24px;
            color: #111827;
            font-weight: 500;
          }
          .intro-text {
            color: #374151;
            margin-bottom: 28px;
            line-height: 1.7;
          }
          .fee-section {
            background: #fdf2f8;
            border: 2px solid #be185d;
            border-radius: 4px;
            padding: 32px;
            text-align: center;
            margin: 32px 0;
          }
          .fee-title {
            color: #831843;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .fee-amount {
            font-size: 42px;
            font-weight: 700;
            color: #be185d;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 18px 30px;
            border-radius: 4px;
            border: 2px solid #be185d;
            display: inline-block;
            margin: 12px 0;
          }
          .fee-subtitle {
            margin: 12px 0 0 0;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
          }
          .asset-details {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 28px;
            margin: 28px 0;
            border-radius: 4px;
          }
          .details-title {
            color: #be185d;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 2px solid #fce7f3;
            padding-bottom: 10px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
          }
          .details-table td {
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .details-table tr:last-child td {
            border-bottom: none;
          }
          .details-table .label {
            font-weight: 600;
            color: #374151;
            width: 45%;
          }
          .details-table .value {
            color: #6b7280;
            font-weight: 500;
          }
          .approval-button {
            text-align: center;
            margin: 36px 0;
          }
          .approve-btn {
            display: inline-block;
            background: linear-gradient(135deg, #be185d, #9f1239);
            color: white;
            padding: 16px 48px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(190, 24, 93, 0.25);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .approve-btn:hover {
            background: linear-gradient(135deg, #9f1239, #831843);
            box-shadow: 0 6px 10px rgba(190, 24, 93, 0.35);
          }
          .important-note {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
            padding: 24px;
            margin: 28px 0;
          }
          .note-title {
            color: #92400e;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .note-content {
            margin: 0;
            color: #78350f;
            line-height: 1.8;
          }
          .note-content ul {
            margin: 8px 0;
            padding-left: 20px;
          }
          .note-content li {
            margin: 8px 0;
          }
          .footer {
            background: #1f2937;
            color: #d1d5db;
            padding: 32px 40px;
            border-top: 4px solid #be185d;
          }
          .footer-content {
            font-size: 14px;
            line-height: 1.6;
          }
          .footer-brand {
            color: #f3f4f6;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 16px;
          }
          .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #4b5563;
            color: #9ca3af;
          }
          .company-info div {
            margin: 6px 0;
          }
          .copyright {
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
          }
          .support-text {
            color: #4b5563;
            margin-top: 32px;
            padding: 18px;
            background: #f9fafb;
            border-radius: 4px;
            border-left: 3px solid #be185d;
            font-size: 14px;
            line-height: 1.6;
          }
          @media (max-width: 600px) {
            .content, .header, .footer {
              padding: 24px;
            }
            .fee-amount {
              font-size: 32px;
              padding: 14px 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Fee Payment Approval Required</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${sellerName},
            </div>
            
            <p class="intro-text">Your asset tokenization process is nearing completion. To finalize and post your token to the marketplace, we require your approval for the processing fee payment.</p>
            
            <div class="fee-section">
              <div class="fee-title">Processing Fee Amount</div>
              <div class="fee-amount">€${assetData.feeAmount}</div>
              <p class="fee-subtitle">1% of Invoice Face Value</p>
            </div>
            
            <div class="asset-details">
              <div class="details-title">Contract Details</div>
              <table class="details-table">
                <tr>
                  <td class="label">Invoice Number:</td>
                  <td class="value">${assetData.invoiceNumber}</td>
                </tr>
                <tr>
                  <td class="label">Face Value:</td>
                  <td class="value">€${assetData.faceValue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Payment Due Date:</td>
                  <td class="value">${new Date(
                    assetData.paymentDate
                  ).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td class="label">Processing Fee (1%):</td>
                  <td class="value">€${assetData.feeAmount}</td>
                </tr>
              </table>
            </div>
            
            <div class="approval-button">
              <a href="${approvalUrl}" class="approve-btn">
                Approve Payment
              </a>
            </div>
            
            <div class="important-note">
              <div class="note-title">Important Information</div>
              <div class="note-content">
                <ul>
                  <li>By clicking the "Approve Payment" button, you confirm that you have transferred €${
                    assetData.feeAmount
                  } to Liqwik's designated account.</li>
                  <li>This approval will upgrade your token status from Copper to Gold, enabling marketplace posting.</li>
                  <li>Once approved, you may complete the token posting process through your Liqwik application dashboard.</li>
                  <li>This approval link remains valid for 24 hours from the time of this email.</li>
                </ul>
              </div>
            </div>
            
            <div class="support-text">
              If you did not initiate this request or require assistance, please contact our support team immediately at support@liqwik.com
            </div>
            
            <p style="color: #6b7280; margin-top: 32px; margin-bottom: 0;">
              Best regards,<br>
              <strong>The ${appName} Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <div class="footer-brand">
                ${appName}
              </div>
              <div style="color: #9ca3af;">
                Secure Financial Platform
              </div>
              <div class="company-info">
                <div>${companyLocation}</div>
                <div>Email: support@liqwik.com</div>
                <div>Web: ${appUrl}</div>
              </div>
              <div class="copyright">
                &copy; 2024 ${appName}. All rights reserved.<br>
                This is an automated message. Please do not reply to this email.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Dear ${sellerName},
      
      Your asset tokenization process is nearing completion. To finalize and post your token to the marketplace, we require your approval for the processing fee payment.
      
      PROCESSING FEE AMOUNT: €${assetData.feeAmount} (1% of Invoice Face Value)
      
      CONTRACT DETAILS:
      - Invoice Number: ${assetData.invoiceNumber}
      - Face Value: €${assetData.faceValue.toFixed(2)}
      - Payment Due Date: ${new Date(
        assetData.paymentDate
      ).toLocaleDateString()}
      - Processing Fee (1%): €${assetData.feeAmount}
      
      To approve the payment, please visit:
      ${approvalUrl}
      
      IMPORTANT INFORMATION:
      - By clicking the "Approve Payment" button, you confirm that you have transferred €${
        assetData.feeAmount
      } to Liqwik's designated account.
      - This approval will upgrade your token status from Copper to Gold, enabling marketplace posting.
      - Once approved, you may complete the token posting process through your Liqwik application dashboard.
      - This approval link remains valid for 24 hours from the time of this email.
      
      If you did not initiate this request or require assistance, please contact our support team immediately at support@liqwik.com
      
      Best regards,
      The ${appName} Team
      
      ${appName}
      ${companyLocation}
      ${appUrl}
      
      © 2024 ${appName}. All rights reserved.
    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendBidAcceptedEmail(data: BidAcceptedEmailData): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const discount = ((data.faceValue - data.bidAmount) / data.faceValue) * 100;
    const savings = data.faceValue - data.bidAmount;
    const paymentApprovalUrl = `${appUrl}/api/approve-payment/${data.paymentApprovalToken}`;

    const subject = `${appName} - Bid Acceptance Notification - Payment Required Within 24 Hours`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bid Accepted - ${appName}</title>
      <style>
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.6;
          color: #2d2d2d;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background: white;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 40px 30px;
          text-align: center;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .header p {
          margin: 15px 0 0 0;
          font-size: 16px;
          opacity: 0.95;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.25);
          padding: 10px 24px;
          border-radius: 4px;
          margin-top: 20px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.5px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .content {
          padding: 40px 35px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #1a1a1a;
          font-weight: 600;
        }
        .intro-text {
          font-size: 16px;
          color: #be185d;
          font-weight: 600;
          margin-bottom: 30px;
          line-height: 1.5;
        }
        .urgent-notice {
          background: linear-gradient(135deg, #fce7f3, #fbcfe8);
          border: 2px solid #be185d;
          border-radius: 4px;
          padding: 28px;
          margin: 30px 0;
          text-align: center;
        }
        .urgent-title {
          color: #831843;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .countdown {
          font-size: 36px;
          font-weight: 700;
          color: #be185d;
          margin: 15px 0;
          font-family: 'Georgia', serif;
        }
        .deadline-date {
          font-size: 15px;
          color: #831843;
          font-weight: 600;
          margin-top: 10px;
        }
        .section-title {
          color: #be185d;
          font-weight: 700;
          font-size: 16px;
          margin: 30px 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #fbcfe8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .details-table td {
          padding: 14px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          font-weight: 600;
          color: #4b5563;
          width: 50%;
        }
        .details-table .value {
          color: #1f2937;
          text-align: right;
          font-weight: 500;
        }
        .highlight-row {
          background: #fdf2f8;
        }
        .highlight-row td {
          color: #be185d !important;
          font-weight: 700 !important;
          font-size: 17px !important;
          padding: 16px 0 !important;
        }
        .divider-row {
          border-top: 2px solid #be185d !important;
        }
        .savings-box {
          background: linear-gradient(135deg, #fdf2f8, #fce7f3);
          border: 2px solid #be185d;
          border-radius: 4px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
        }
        .savings-label {
          color: #831843;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .savings-amount {
          font-size: 32px;
          font-weight: 700;
          color: #be185d;
          margin: 12px 0;
          font-family: 'Georgia', serif;
        }
        .action-box {
          background: #fff1f2;
          border-left: 4px solid #be185d;
          border-radius: 4px;
          padding: 25px;
          margin: 30px 0;
        }
        .action-title {
          color: #831843;
          font-weight: 700;
          margin-bottom: 12px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .action-text {
          margin: 0;
          color: #4b5563;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 16px 48px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          margin: 25px 0;
          box-shadow: 0 4px 6px rgba(190, 24, 93, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #9f1239, #831843);
        }
        .info-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 25px;
          margin: 25px 0;
        }
        .info-box p {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.8;
        }
        .info-box strong {
          color: #1f2937;
          display: block;
          margin-bottom: 10px;
        }
        .footer {
          background: linear-gradient(135deg, #831843, #500724);
          color: #fce7f3;
          padding: 35px 30px;
          text-align: center;
        }
        .footer-content {
          font-size: 14px;
          line-height: 1.8;
        }
        .footer-title {
          font-weight: 700;
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 15px;
        }
        .company-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #be185d;
          color: #fbcfe8;
          line-height: 2;
        }
        .footer-disclaimer {
          margin-top: 25px;
          font-size: 12px;
          color: #fbcfe8;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 25px 20px;
          }
          .countdown {
            font-size: 28px;
          }
          .cta-button {
            padding: 14px 32px;
            font-size: 13px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Bid Acceptance Notification</p>
          <div class="status-badge">
            APPROVED
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${data.buyerName},
          </div>
          
          <p class="intro-text">
            We are pleased to inform you that your bid has been accepted by ${
              data.sellerName
            }. Please review the details below and complete the payment process within the specified timeframe.
          </p>
          
          <div class="urgent-notice">
            <div class="urgent-title">
              Urgent: Payment Required
            </div>
            <div class="countdown">24 Hours</div>
            <div class="deadline-date">
              Payment Deadline: ${new Date(data.paymentDeadline).toLocaleString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                }
              )}
            </div>
          </div>
          
          <div class="section-title">Transaction Details</div>
          
          <table class="details-table">
            <tr>
              <td class="label">Seller Name:</td>
              <td class="value">${data.sellerName}</td>
            </tr>
            <tr>
              <td class="label">Invoice Number:</td>
              <td class="value">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td class="label">Invoice Date:</td>
              <td class="value">${new Date(data.invoiceDate).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}</td>
            </tr>
            <tr>
              <td class="label">Payment Due Date:</td>
              <td class="value">${new Date(data.paymentDate).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}</td>
            </tr>
          </table>
          
          <div class="section-title">Financial Summary</div>
          
          <table class="details-table">
            <tr>
              <td class="label">Original Face Value:</td>
              <td class="value">${data.faceValue.toFixed(2)} EUR</td>
            </tr>
            <tr class="highlight-row">
              <td class="label">Your Bid Amount:</td>
              <td class="value">${data.bidAmount.toFixed(2)} EUR</td>
            </tr>
            <tr>
              <td class="label">Discount Rate:</td>
              <td class="value">${discount.toFixed(2)}%</td>
            </tr>
          </table>
          
          <div class="savings-box">
            <div class="savings-label">Total Savings</div>
            <div class="savings-amount">${savings.toFixed(2)} EUR</div>
            <div class="savings-label">Discount Applied: ${discount.toFixed(
              2
            )}%</div>
          </div>
          
          <div class="action-box">
            <div class="action-title">Action Required</div>
            <p class="action-text">
              You are required to complete the payment of <strong>${data.bidAmount.toFixed(
                2
              )} EUR</strong> within 24 hours to finalize this transaction. After completing the payment transfer, please confirm the transaction using the button below.
            </p>
          </div>
          
          <p style="color: #6b7280; margin-top: 35px; line-height: 1.6;">
            Should you require any assistance with the payment process or have questions regarding this transaction, please do not hesitate to contact our customer support team.
          </p>
          
          <p style="color: #4b5563; margin-top: 30px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-title">
              ${appName}
            </div>
            <div>
              Secure Financial Transaction Platform
            </div>
            <div class="company-info">
              Location: ${companyLocation}<br>
              Email: support@liqwik.com<br>
              Website: ${appUrl}
            </div>
            <div class="footer-disclaimer">
              Copyright 2024 ${appName}. All rights reserved.<br>
              This is an automated notification. Please do not reply to this email.<br>
              For support inquiries, please contact support@liqwik.com
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    ${appName} - BID ACCEPTANCE NOTIFICATION
    
    Dear ${data.buyerName},
    
    We are pleased to inform you that your bid has been accepted by ${
      data.sellerName
    }.
    
    URGENT: PAYMENT REQUIRED WITHIN 24 HOURS
    Payment Deadline: ${new Date(data.paymentDeadline).toLocaleString()}
    
    TRANSACTION DETAILS:
    - Seller Name: ${data.sellerName}
    - Invoice Number: ${data.invoiceNumber}
    - Invoice Date: ${new Date(data.invoiceDate).toLocaleDateString()}
    - Payment Due Date: ${new Date(data.paymentDate).toLocaleDateString()}
    
    FINANCIAL SUMMARY:
    - Original Face Value: ${data.faceValue.toFixed(2)} EUR
    - Your Bid Amount: ${data.bidAmount.toFixed(2)} EUR
    - Discount Rate: ${discount.toFixed(2)}%
    - Total Savings: ${savings.toFixed(2)} EUR
    
    ACTION REQUIRED:
    Please complete the payment of ${data.bidAmount.toFixed(
      2
    )} EUR within 24 hours.
    
    After completing the payment, confirm it here: ${paymentApprovalUrl}
    
    PAYMENT PROCESS:
    1. Transfer ${data.bidAmount.toFixed(
      2
    )} EUR to the seller's designated account
    2. Click the confirmation link above
    3. Await verification from our team
    4. Receive final confirmation email
    
    For assistance, contact our support team at support@liqwik.com
    
    Best regards,
    The ${appName} Team
    
    ---
    ${appName} | ${companyLocation}
    This is an automated notification. Please do not reply to this email.
  `;

    await this.sendEmail({ to: data.buyerEmail, subject, html, text });
  }

  async sendPaymentConfirmationEmail(
    data: PaymentConfirmationEmailData
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const discount = ((data.faceValue - data.bidAmount) / data.faceValue) * 100;
    const savings = data.faceValue - data.bidAmount;

    const subject = `${appName} - Payment Confirmation: Contract Settlement Complete`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 40px 40px 35px 40px;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .header-subtitle {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
          font-weight: 400;
        }
        .status-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.2px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .content {
          padding: 40px 40px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #111827;
          font-weight: 400;
        }
        .confirmation-notice {
          background: #fce7f3;
          border-left: 4px solid #be185d;
          padding: 20px 25px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .confirmation-notice h3 {
          color: #9f1239;
          font-weight: 600;
          font-size: 18px;
          margin: 0 0 12px 0;
        }
        .confirmation-notice p {
          color: #4b5563;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }
        .transaction-details {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          padding: 30px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .section-title {
          color: #be185d;
          font-weight: 600;
          margin-bottom: 20px;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 15px;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          font-weight: 500;
          color: #374151;
          width: 50%;
        }
        .details-table .value {
          color: #1f2937;
          text-align: right;
          font-weight: 400;
        }
        .highlight-row {
          background: #fef2f2;
        }
        .highlight-row td {
          padding: 14px 0;
          font-weight: 600;
        }
        .amount-highlight {
          color: #be185d !important;
          font-weight: 700 !important;
          font-size: 18px !important;
        }
        .status-confirmed {
          display: inline-block;
          background: #be185d;
          color: white;
          padding: 5px 14px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .savings-box {
          background: linear-gradient(135deg, #fce7f3, #fbcfe8);
          border: 2px solid #be185d;
          border-radius: 6px;
          padding: 28px;
          margin: 30px 0;
          text-align: center;
        }
        .savings-label {
          color: #9f1239;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .savings-amount {
          font-size: 36px;
          font-weight: 700;
          color: #831843;
          margin: 12px 0;
        }
        .savings-description {
          color: #9f1239;
          font-size: 15px;
          font-weight: 500;
          margin-top: 8px;
        }
        .next-steps-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 28px;
          margin: 30px 0;
        }
        .next-steps-section h3 {
          color: #9f1239;
          font-weight: 600;
          margin-bottom: 18px;
          font-size: 17px;
        }
        .next-steps-section ol {
          color: #374151;
          line-height: 1.9;
          padding-left: 20px;
          margin: 0;
        }
        .next-steps-section li {
          margin: 10px 0;
          font-size: 15px;
        }
        .next-steps-section strong {
          color: #1f2937;
          font-weight: 600;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 14px 40px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 25px 0;
          font-size: 15px;
          letter-spacing: 0.3px;
          border: none;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #9f1239, #831843);
          box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
        }
        .notice-box {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 18px 22px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .notice-box p {
          margin: 0;
          color: #78350f;
          font-size: 14px;
          line-height: 1.6;
        }
        .notice-box strong {
          font-weight: 600;
        }
        .closing-text {
          color: #4b5563;
          margin-top: 30px;
          font-size: 15px;
          line-height: 1.6;
        }
        .signature {
          color: #1f2937;
          margin-top: 25px;
          font-size: 15px;
        }
        .signature strong {
          color: #be185d;
          font-weight: 600;
        }
        .footer {
          background: linear-gradient(135deg, #9f1239, #831843);
          color: #fce7f3;
          padding: 35px 40px;
          text-align: center;
        }
        .footer-content {
          font-size: 14px;
          line-height: 1.8;
        }
        .footer-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 15px;
        }
        .company-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(252, 231, 243, 0.3);
          color: #fce7f3;
        }
        .footer-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
        }
        .footer-link:hover {
          text-decoration: underline;
        }
        .footer-disclaimer {
          margin-top: 25px;
          font-size: 12px;
          opacity: 0.85;
          line-height: 1.6;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 25px 0;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 25px 20px;
          }
          .transaction-details, .next-steps-section, .savings-box {
            padding: 20px;
          }
          .savings-amount {
            font-size: 28px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p class="header-subtitle">Payment Confirmation Notice</p>
          <div class="status-badge">
            CONTRACT SETTLED
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${data.buyerName},
          </div>
          
          <div class="confirmation-notice">
            <h3>Payment Successfully Confirmed</h3>
            <p>
              This is to confirm that your payment has been successfully processed and the contract with <strong>${
                data.sellerName
              }</strong> has been completed. This transaction is now fully settled.
            </p>
          </div>
          
          <div class="transaction-details">
            <div class="section-title">Transaction Summary</div>
            <table class="details-table">
              <tr>
                <td class="label">Invoice Number</td>
                <td class="value"><strong>${data.invoiceNumber}</strong></td>
              </tr>
              <tr>
                <td class="label">Seller Name</td>
                <td class="value">${data.sellerName}</td>
              </tr>
              <tr>
                <td class="label">Invoice Date</td>
                <td class="value">${new Date(
                  data.invoiceDate
                ).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td class="label">Original Payment Due Date</td>
                <td class="value">${new Date(
                  data.paymentDate
                ).toLocaleDateString()}</td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <div class="section-title" style="margin-top: 25px;">Financial Details</div>
            <table class="details-table">
              <tr>
                <td class="label">Original Face Value</td>
                <td class="value">€${data.faceValue.toFixed(2)}</td>
              </tr>
              <tr class="highlight-row">
                <td class="label">Amount Paid</td>
                <td class="value amount-highlight">€${data.bidAmount.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td class="label">Discount Received</td>
                <td class="value" style="color: #be185d; font-weight: 600;">${discount.toFixed(
                  2
                )}%</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td class="label">Payment Status</td>
                <td class="value">
                  <span class="status-confirmed">CONFIRMED</span>
                </td>
              </tr>
              <tr>
                <td class="label">Confirmation Date & Time</td>
                <td class="value">${new Date(data.confirmedAt).toLocaleString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}</td>
              </tr>
            </table>
          </div>
          
          <div class="savings-box">
            <div class="savings-label">Total Savings on This Transaction</div>
            <div class="savings-amount">€${savings.toFixed(2)}</div>
            <div class="savings-description">
              ${discount.toFixed(2)}% discount on the original face value
            </div>
          </div>
          
          <div class="next-steps-section">
            <h3>What Happens Next</h3>
            <ol>
              <li><strong>Contract Finalized:</strong> Your transaction with ${
                data.sellerName
              } is now complete and fully settled</li>
              <li><strong>Records Updated:</strong> This payment confirmation has been recorded in our system</li>
              <li><strong>Documentation:</strong> Please retain this email for your financial records</li>
              <li><strong>Dashboard Access:</strong> View complete transaction details anytime through your account dashboard</li>
            </ol>
          </div>
          
          <div style="text-align: center;">
            <a href="${appUrl}/dashboard" class="cta-button">
              View Transaction in Dashboard
            </a>
          </div>
          
          <div class="notice-box">
            <p>
              <strong>Important Notice:</strong> This email serves as official confirmation of your payment and contract completion. Should you have any questions regarding this transaction, please contact our support team.
            </p>
          </div>
          
          <p class="closing-text">
            Thank you for using ${appName} for your financial transactions. We are committed to providing you with secure, efficient, and professional services.
          </p>
          
          <div class="signature">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-title">
              ${appName} - Secure Financial Platform
            </div>
            <div class="company-info">
              Location: ${companyLocation}<br>
              Email: <a href="mailto:support@liqwik.com" class="footer-link">support@liqwik.com</a><br>
              Website: <a href="${appUrl}" class="footer-link">${appUrl}</a>
            </div>
            <div class="footer-disclaimer">
              &copy; 2024 ${appName}. All rights reserved.<br>
              This is an automated confirmation email. Please do not reply directly to this message.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Dear ${data.buyerName},
    
    PAYMENT CONFIRMATION - CONTRACT SETTLEMENT COMPLETE
    
    This is to confirm that your payment has been successfully processed and the contract with ${
      data.sellerName
    } has been completed.
    
    TRANSACTION SUMMARY
    =====================
    Invoice Number: ${data.invoiceNumber}
    Seller Name: ${data.sellerName}
    Invoice Date: ${new Date(data.invoiceDate).toLocaleDateString()}
    Original Payment Due Date: ${new Date(
      data.paymentDate
    ).toLocaleDateString()}
    
    FINANCIAL DETAILS
    ==================
    Original Face Value: €${data.faceValue.toFixed(2)}
    Amount Paid: €${data.bidAmount.toFixed(2)}
    Discount Received: ${discount.toFixed(2)}%
    Total Savings: €${savings.toFixed(2)}
    
    Payment Status: CONFIRMED
    Confirmation Date & Time: ${new Date(data.confirmedAt).toLocaleString()}
    
    WHAT HAPPENS NEXT
    ==================
    1. Contract Finalized: Your transaction with ${
      data.sellerName
    } is now complete and fully settled
    2. Records Updated: This payment confirmation has been recorded in our system
    3. Documentation: Please retain this email for your financial records
    4. Dashboard Access: View complete transaction details at ${appUrl}/dashboard
    
    Thank you for using ${appName} for your financial transactions.
    
    If you have any questions, please contact our support team at support@liqwik.com
    
    Best regards,
    The ${appName} Team
    
    ---
    ${appName} - Secure Financial Platform
    ${companyLocation}
    ${appUrl}
    
    © 2024 ${appName}. All rights reserved.
    This is an automated confirmation email. Please do not reply directly to this message.
  `;

    await this.sendEmail({ to: data.buyerEmail, subject, html, text });
  }

  async sendSellerPaymentNotificationEmail(
    data: SellerPaymentNotificationEmailData
  ): Promise<void> {
    const appName = process.env.APP_NAME || "Liqwik";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const companyLocation =
      process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

    const discount = ((data.faceValue - data.bidAmount) / data.faceValue) * 100;
    const amountReceived = data.bidAmount;

    const subject = `${appName} - Payment Received: Contract with ${data.buyerName} Settled`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 40px 40px 35px 40px;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .header-subtitle {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
          font-weight: 400;
        }
        .status-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.2px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .content {
          padding: 40px 40px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #111827;
          font-weight: 400;
        }
        .notification-notice {
          background: #fce7f3;
          border-left: 4px solid #be185d;
          padding: 20px 25px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .notification-notice h3 {
          color: #9f1239;
          font-weight: 600;
          font-size: 18px;
          margin: 0 0 12px 0;
        }
        .notification-notice p {
          color: #4b5563;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }
        .transaction-details {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          padding: 30px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .section-title {
          color: #be185d;
          font-weight: 600;
          margin-bottom: 20px;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 15px;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          font-weight: 500;
          color: #374151;
          width: 50%;
        }
        .details-table .value {
          color: #1f2937;
          text-align: right;
          font-weight: 400;
        }
        .highlight-row {
          background: #fef2f2;
        }
        .highlight-row td {
          padding: 14px 0;
          font-weight: 600;
        }
        .amount-highlight {
          color: #be185d !important;
          font-weight: 700 !important;
          font-size: 18px !important;
        }
        .status-confirmed {
          display: inline-block;
          background: #be185d;
          color: white;
          padding: 5px 14px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .payment-received-box {
          background: linear-gradient(135deg, #fce7f3, #fbcfe8);
          border: 2px solid #be185d;
          border-radius: 6px;
          padding: 28px;
          margin: 30px 0;
          text-align: center;
        }
        .payment-label {
          color: #9f1239;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .payment-amount {
          font-size: 36px;
          font-weight: 700;
          color: #831843;
          margin: 12px 0;
        }
        .payment-description {
          color: #9f1239;
          font-size: 15px;
          font-weight: 500;
          margin-top: 8px;
        }
        .information-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 28px;
          margin: 30px 0;
        }
        .information-section h3 {
          color: #9f1239;
          font-weight: 600;
          margin-bottom: 18px;
          font-size: 17px;
        }
        .information-section ul {
          color: #374151;
          line-height: 1.9;
          padding-left: 20px;
          margin: 0;
        }
        .information-section li {
          margin: 10px 0;
          font-size: 15px;
        }
        .information-section strong {
          color: #1f2937;
          font-weight: 600;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 14px 40px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 25px 0;
          font-size: 15px;
          letter-spacing: 0.3px;
          border: none;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #9f1239, #831843);
          box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
        }
        .important-notice {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 18px 22px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .important-notice p {
          margin: 0;
          color: #1e40af;
          font-size: 14px;
          line-height: 1.6;
        }
        .important-notice strong {
          font-weight: 600;
          color: #1e3a8a;
        }
        .closing-text {
          color: #4b5563;
          margin-top: 30px;
          font-size: 15px;
          line-height: 1.6;
        }
        .signature {
          color: #1f2937;
          margin-top: 25px;
          font-size: 15px;
        }
        .signature strong {
          color: #be185d;
          font-weight: 600;
        }
        .footer {
          background: linear-gradient(135deg, #9f1239, #831843);
          color: #fce7f3;
          padding: 35px 40px;
          text-align: center;
        }
        .footer-content {
          font-size: 14px;
          line-height: 1.8;
        }
        .footer-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 15px;
        }
        .company-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(252, 231, 243, 0.3);
          color: #fce7f3;
        }
        .footer-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
        }
        .footer-link:hover {
          text-decoration: underline;
        }
        .footer-disclaimer {
          margin-top: 25px;
          font-size: 12px;
          opacity: 0.85;
          line-height: 1.6;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 25px 0;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 25px 20px;
          }
          .transaction-details, .information-section, .payment-received-box {
            padding: 20px;
          }
          .payment-amount {
            font-size: 28px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p class="header-subtitle">Payment Received Notification</p>
          <div class="status-badge">
            PAYMENT CONFIRMED
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${data.sellerName},
          </div>
          
          <div class="notification-notice">
            <h3>Payment Successfully Received</h3>
            <p>
              We are pleased to inform you that <strong>${
                data.buyerName
              }</strong> has confirmed their payment for invoice <strong>${
      data.invoiceNumber
    }</strong>. The contract has been successfully settled.
            </p>
          </div>
          
          <div class="transaction-details">
            <div class="section-title">Transaction Details</div>
            <table class="details-table">
              <tr>
                <td class="label">Invoice Number</td>
                <td class="value"><strong>${data.invoiceNumber}</strong></td>
              </tr>
              <tr>
                <td class="label">Buyer Name</td>
                <td class="value">${data.buyerName}</td>
              </tr>
              <tr>
                <td class="label">Invoice Date</td>
                <td class="value">${new Date(
                  data.invoiceDate
                ).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td class="label">Original Payment Due Date</td>
                <td class="value">${new Date(
                  data.paymentDate
                ).toLocaleDateString()}</td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <div class="section-title" style="margin-top: 25px;">Financial Summary</div>
            <table class="details-table">
              <tr>
                <td class="label">Original Face Value</td>
                <td class="value">€${data.faceValue.toFixed(2)}</td>
              </tr>
              <tr class="highlight-row">
                <td class="label">Amount Received</td>
                <td class="value amount-highlight">€${amountReceived.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td class="label">Discount Offered</td>
                <td class="value" style="color: #be185d; font-weight: 600;">${discount.toFixed(
                  2
                )}%</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td class="label">Payment Status</td>
                <td class="value">
                  <span class="status-confirmed">CONFIRMED</span>
                </td>
              </tr>
              <tr>
                <td class="label">Confirmation Date & Time</td>
                <td class="value">${new Date(data.confirmedAt).toLocaleString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}</td>
              </tr>
            </table>
          </div>
          
          <div class="payment-received-box">
            <div class="payment-label">Payment Received</div>
            <div class="payment-amount">€${amountReceived.toFixed(2)}</div>
            <div class="payment-description">
              Successfully received from ${data.buyerName}
            </div>
          </div>
          
          <div class="information-section">
            <h3>Transaction Summary</h3>
            <ul>
              <li><strong>Contract Completed:</strong> The transaction with ${
                data.buyerName
              } has been finalized</li>
              <li><strong>Payment Confirmed:</strong> The buyer has confirmed payment of €${amountReceived.toFixed(
                2
              )}</li>
              <li><strong>Records Updated:</strong> This transaction has been recorded in our system</li>
              <li><strong>Dashboard Access:</strong> View complete transaction details through your seller dashboard</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${appUrl}/dashboard" class="cta-button">
              View Transaction Details
            </a>
          </div>
          
          <div class="important-notice">
            <p>
              <strong>Important Notice:</strong> This email confirms that the buyer has marked the payment as complete. Please verify the payment has been received in your bank account. If you have any concerns or discrepancies, please contact our support team immediately.
            </p>
          </div>
          
          <p class="closing-text">
            Thank you for using ${appName} for your financial transactions. We appreciate your business and look forward to continuing to serve your needs.
          </p>
          
          <div class="signature">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-title">
              ${appName} - Secure Financial Platform
            </div>
            <div class="company-info">
              Location: ${companyLocation}<br>
              Email: <a href="mailto:support@liqwik.com" class="footer-link">support@liqwik.com</a><br>
              Website: <a href="${appUrl}" class="footer-link">${appUrl}</a>
            </div>
            <div class="footer-disclaimer">
              &copy; 2024 ${appName}. All rights reserved.<br>
              This is an automated notification email. Please do not reply directly to this message.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Dear ${data.sellerName},
    
    PAYMENT RECEIVED - CONTRACT SETTLED
    
    We are pleased to inform you that ${
      data.buyerName
    } has confirmed their payment for invoice ${
      data.invoiceNumber
    }. The contract has been successfully settled.
    
    TRANSACTION DETAILS
    =====================
    Invoice Number: ${data.invoiceNumber}
    Buyer Name: ${data.buyerName}
    Invoice Date: ${new Date(data.invoiceDate).toLocaleDateString()}
    Original Payment Due Date: ${new Date(
      data.paymentDate
    ).toLocaleDateString()}
    
    FINANCIAL SUMMARY
    ==================
    Original Face Value: €${data.faceValue.toFixed(2)}
    Amount Received: €${amountReceived.toFixed(2)}
    Discount Offered: ${discount.toFixed(2)}%
    
    Payment Status: CONFIRMED
    Confirmation Date & Time: ${new Date(data.confirmedAt).toLocaleString()}
    
    TRANSACTION SUMMARY
    ====================
    • Contract Completed: The transaction with ${
      data.buyerName
    } has been finalized
    • Payment Confirmed: The buyer has confirmed payment of €${amountReceived.toFixed(
      2
    )}
    • Records Updated: This transaction has been recorded in our system
    • Dashboard Access: View complete details at ${appUrl}/dashboard
    
    IMPORTANT NOTICE
    ================
    This email confirms that the buyer has marked the payment as complete. Please verify the payment has been received in your bank account. If you have any concerns or discrepancies, please contact our support team immediately.
    
    Thank you for using ${appName} for your financial transactions.
    
    If you have any questions, please contact our support team at support@liqwik.com
    
    Best regards,
    The ${appName} Team
    
    ---
    ${appName} - Secure Financial Platform
    ${companyLocation}
    ${appUrl}
    
    © 2024 ${appName}. All rights reserved.
    This is an automated notification email. Please do not reply directly to this message.
  `;

    await this.sendEmail({ to: data.sellerEmail, subject, html, text });
  }

async sendAssetPostedEmail(data: AssetPostedEmailData): Promise<void> {
  const appName = process.env.APP_NAME || "Liqwik";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const companyLocation =
    process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

  const subject = `${appName} - Asset Successfully Posted`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asset Posted - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 40px 40px 35px 40px;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .header-subtitle {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
          font-weight: 400;
        }
        .status-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.2px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .content {
          padding: 40px 40px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #111827;
          font-weight: 400;
        }
        .success-notice {
          background: #d1fae5;
          border-left: 4px solid #059669;
          padding: 20px 25px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .success-notice p {
          color: #065f46;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
          font-weight: 600;
        }
        .asset-details {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          padding: 30px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .section-title {
          color: #be185d;
          font-weight: 600;
          margin-bottom: 20px;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 15px;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          font-weight: 500;
          color: #374151;
          width: 50%;
        }
        .details-table .value {
          color: #1f2937;
          text-align: right;
          font-weight: 400;
        }
        .highlight-value {
          color: #be185d;
          font-weight: 600;
        }
        .info-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 25px;
          margin: 30px 0;
        }
        .info-section p {
          color: #374151;
          font-size: 15px;
          line-height: 1.7;
          margin: 0 0 12px 0;
        }
        .info-section p:last-child {
          margin-bottom: 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 14px 40px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 25px 0;
          font-size: 15px;
          letter-spacing: 0.3px;
          border: none;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #9f1239, #831843);
          box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
        }
        .closing-text {
          color: #4b5563;
          margin-top: 25px;
          font-size: 15px;
          line-height: 1.6;
        }
        .signature {
          color: #1f2937;
          margin-top: 25px;
          font-size: 15px;
        }
        .signature strong {
          color: #be185d;
          font-weight: 600;
        }
        .footer {
          background: linear-gradient(135deg, #9f1239, #831843);
          color: #fce7f3;
          padding: 35px 40px;
          text-align: center;
        }
        .footer-content {
          font-size: 14px;
          line-height: 1.8;
        }
        .footer-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 15px;
        }
        .company-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(252, 231, 243, 0.3);
          color: #fce7f3;
        }
        .footer-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
        }
        .footer-link:hover {
          text-decoration: underline;
        }
        .footer-disclaimer {
          margin-top: 25px;
          font-size: 12px;
          opacity: 0.85;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 25px 20px;
          }
          .asset-details, .info-section {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p class="header-subtitle">Asset Posting Confirmation</p>
          <div class="status-badge">
            SUCCESSFULLY POSTED
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${data.sellerName},
          </div>
          
          <div class="success-notice">
            <p>
              Your asset has been successfully posted on ${appName} and is now visible to potential buyers.
            </p>
          </div>
          
          <div class="info-section">
            <p>Your asset is now available on the ${appName} platform for buyers to view and place bids. You will receive notifications when buyers express interest or place bids on your asset.</p>
          </div>
          
          <div class="asset-details">
            <div class="section-title">Asset Details</div>
            <table class="details-table">
              <tr>
                <td class="label">Asset ID</td>
                <td class="value highlight-value">${data.assetId}</td>
              </tr>
              <tr>
                <td class="label">Invoice Number</td>
                <td class="value">${data.invoiceNumber}</td>
              </tr>
              <tr>
                <td class="label">Face Value</td>
                <td class="value">€${data.faceValue.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">Processing Fee</td>
                <td class="value">€${data.feeAmount}</td>
              </tr>
              <tr>
                <td class="label">Payment Date</td>
                <td class="value">${new Date(
                  data.paymentDate
                ).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td class="label">Posted Date & Time</td>
                <td class="value">${new Date(
                  data.postedAt
                ).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</td>
              </tr>
            </table>
          </div>
          
          <div class="info-section">
            <p>You can view and manage your asset through your ${appName} dashboard. Track bidding activity, respond to buyer inquiries, and monitor the status of your listing in real-time.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${appUrl}/sellers/assets/${data.assetId}" class="cta-button">
              View Asset Details
            </a>
          </div>
          
          <p class="closing-text">
            If you have any questions or require assistance, please do not hesitate to contact our support team.
          </p>
          
          <div class="signature">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-title">
              ${appName} - Secure Financial Platform
            </div>
            <div class="company-info">
              Location: ${companyLocation}<br>
              Email: <a href="mailto:support@liqwik.com" class="footer-link">support@liqwik.com</a><br>
              Website: <a href="${appUrl}" class="footer-link">${appUrl}</a>
            </div>
            <div class="footer-disclaimer">
              &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
              This is an automated message. Please do not reply directly to this email.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Dear ${data.sellerName},
    
    ASSET SUCCESSFULLY POSTED
    
    Your asset has been successfully posted on ${appName} and is now visible to potential buyers.
    
    ASSET DETAILS
    =============
    Asset ID: ${data.assetId}
    Invoice Number: ${data.invoiceNumber}
    Face Value: €${data.faceValue.toFixed(2)}
    Processing Fee: €${data.feeAmount}
    Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}
    Posted Date & Time: ${new Date(data.postedAt).toLocaleString()}
    
    Your asset is now available on the ${appName} platform for buyers to view and place bids. You will receive notifications when buyers express interest or place bids on your asset.
    
    You can view and manage your asset at: ${appUrl}/sellers/assets/${
    data.assetId
  }
    
    If you have any questions, please contact our support team at support@liqwik.com
    
    Best regards,
    The ${appName} Team
    
    ---
    ${appName} - Secure Financial Platform
    ${companyLocation}
    ${appUrl}
    
    © ${new Date().getFullYear()} ${appName}. All rights reserved.
  `;

  await this.sendEmail({
    to: data.sellerEmail,
    subject,
    html,
    text,
  });
}

async sendAssetCancelledEmail(data: AssetCancelledEmailData): Promise<void> {
  const appName = process.env.APP_NAME || "Liqwik";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const companyLocation =
    process.env.COMPANY_LOCATION || "Chennai, Tamil Nadu, India";

  const subject = `${appName} - Asset Cancelled`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asset Cancelled - ${appName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .email-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 40px 40px 35px 40px;
          border-bottom: 4px solid #831843;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .header-subtitle {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
          font-weight: 400;
        }
        .status-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.2px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .content {
          padding: 40px 40px;
          background: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #111827;
          font-weight: 400;
        }
        .warning-notice {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px 25px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .warning-notice p {
          color: #92400e;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
          font-weight: 600;
        }
        .asset-details {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          padding: 30px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .section-title {
          color: #be185d;
          font-weight: 600;
          margin-bottom: 20px;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 15px;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          font-weight: 500;
          color: #374151;
          width: 50%;
        }
        .details-table .value {
          color: #1f2937;
          text-align: right;
          font-weight: 400;
        }
        .highlight-value {
          color: #be185d;
          font-weight: 600;
        }
        .info-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 25px;
          margin: 30px 0;
        }
        .info-section p {
          color: #374151;
          font-size: 15px;
          line-height: 1.7;
          margin: 0 0 12px 0;
        }
        .info-section p:last-child {
          margin-bottom: 0;
        }
        .security-notice {
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          padding: 18px 22px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .security-notice p {
          margin: 0;
          color: #991b1b;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }
        .security-notice strong {
          font-weight: 600;
          color: #7f1d1d;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: white;
          padding: 14px 40px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 25px 0;
          font-size: 15px;
          letter-spacing: 0.3px;
          border: none;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #9f1239, #831843);
          box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
        }
        .closing-text {
          color: #4b5563;
          margin-top: 25px;
          font-size: 15px;
          line-height: 1.6;
        }
        .signature {
          color: #1f2937;
          margin-top: 25px;
          font-size: 15px;
        }
        .signature strong {
          color: #be185d;
          font-weight: 600;
        }
        .footer {
          background: linear-gradient(135deg, #9f1239, #831843);
          color: #fce7f3;
          padding: 35px 40px;
          text-align: center;
        }
        .footer-content {
          font-size: 14px;
          line-height: 1.8;
        }
        .footer-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 15px;
        }
        .company-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(252, 231, 243, 0.3);
          color: #fce7f3;
        }
        .footer-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
        }
        .footer-link:hover {
          text-decoration: underline;
        }
        .footer-disclaimer {
          margin-top: 25px;
          font-size: 12px;
          opacity: 0.85;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 25px 20px;
          }
          .asset-details, .info-section {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${appName}</h1>
          <p class="header-subtitle">Asset Cancellation Notice</p>
          <div class="status-badge">
            ASSET CANCELLED
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${data.sellerName},
          </div>
          
          <div class="warning-notice">
            <p>
              Your asset has been cancelled and removed from the ${appName} platform.
            </p>
          </div>
          
          <div class="info-section">
            <p>This asset is no longer available for bidding and has been removed from active listings. No further bids will be accepted for this asset.</p>
          </div>
          
          <div class="asset-details">
            <div class="section-title">Asset Details</div>
            <table class="details-table">
              <tr>
                <td class="label">Asset ID</td>
                <td class="value highlight-value">${data.assetId}</td>
              </tr>
              <tr>
                <td class="label">Invoice Number</td>
                <td class="value">${data.invoiceNumber}</td>
              </tr>
              <tr>
                <td class="label">Face Value</td>
                <td class="value">€${data.faceValue.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">Cancellation Date & Time</td>
                <td class="value">${new Date(
                  data.cancelledAt
                ).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</td>
              </tr>
            </table>
          </div>
          
          <div class="info-section">
            <p>If you cancelled this asset by mistake or would like to post a new asset, you can do so through your ${appName} dashboard. Our platform remains available for your future asset listing needs.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${appUrl}/sellers/dashboard" class="cta-button">
              Go to Dashboard
            </a>
          </div>
          
          <div class="security-notice">
            <p>
              <strong>Security Notice:</strong> If you did not initiate this cancellation or have any concerns about this action, please contact our support team immediately for assistance.
            </p>
          </div>
          
          <p class="closing-text">
            If you have any questions or require further assistance, please do not hesitate to contact our support team.
          </p>
          
          <div class="signature">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-title">
              ${appName} - Secure Financial Platform
            </div>
            <div class="company-info">
              Location: ${companyLocation}<br>
              Email: <a href="mailto:support@liqwik.com" class="footer-link">support@liqwik.com</a><br>
              Website: <a href="${appUrl}" class="footer-link">${appUrl}</a>
            </div>
            <div class="footer-disclaimer">
              &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
              This is an automated message. Please do not reply directly to this email.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Dear ${data.sellerName},
    
    ASSET CANCELLED
    
    Your asset has been cancelled and removed from the ${appName} platform.
    
    ASSET DETAILS
    =============
    Asset ID: ${data.assetId}
    Invoice Number: ${data.invoiceNumber}
    Face Value: €${data.faceValue.toFixed(2)}
    Cancellation Date & Time: ${new Date(data.cancelledAt).toLocaleString()}
    
    This asset is no longer available for bidding and has been removed from active listings.
    
    If you cancelled this asset by mistake or would like to post a new asset, you can do so through your dashboard at: ${appUrl}/sellers/dashboard
    
    SECURITY NOTICE: If you did not initiate this cancellation, please contact our support team immediately.
    
    If you have any questions, please contact our support team at support@liqwik.com
    
    Best regards,
    The ${appName} Team
    
    ---
    ${appName} - Secure Financial Platform
    ${companyLocation}
    ${appUrl}
    
    © ${new Date().getFullYear()} ${appName}. All rights reserved.
  `;

  await this.sendEmail({
    to: data.sellerEmail,
    subject,
    html,
    text,
  });
}
}

export const emailService = new EmailService();
