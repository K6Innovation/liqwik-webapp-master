// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/utils/email-service";
import prisma from "@/utils/prisma-client";
import crypto from "crypto";

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, action, userRoleId, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Handle resend verification code
    if (action === "resend") {
      if (!userRoleId) {
        return NextResponse.json(
          { error: "User role ID is required for resending code" },
          { status: 400 }
        );
      }

      const userRole = await prisma.userRole.findUnique({
        where: { id: userRoleId },
        include: {
          user: true,
          role: true,
        },
      });

      if (!userRole) {
        return NextResponse.json(
          { error: "User role not found" },
          { status: 404 }
        );
      }

      if (userRole.user.email !== email) {
        return NextResponse.json(
          { error: "Email does not match user role" },
          { status: 400 }
        );
      }

      // Generate new verification code
      const newCode = generateVerificationCode();
      const expireDate = new Date();
      expireDate.setMinutes(expireDate.getMinutes() + 15);

      // Update the UserRole with new verification code
      await prisma.userRole.update({
        where: { id: userRoleId },
        data: {
          roleVerificationCode: newCode,
          roleVerificationExpireDate: expireDate,
        },
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          email,
          newCode,
          userRole.user.firstName || "User"
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "New verification code sent to your email"
      }, { status: 200 });
    }

    // Handle verification
    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    if (!userRoleId) {
      return NextResponse.json(
        { error: "User role ID is required" },
        { status: 400 }
      );
    }

    // Find the UserRole
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: {
        user: true,
        role: true,
      },
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 404 }
      );
    }

    if (userRole.user.email !== email) {
      return NextResponse.json(
        { error: "Email does not match user role" },
        { status: 400 }
      );
    }

    // Check if role is already verified
    if (userRole.isRoleVerified) {
      return NextResponse.json(
        { error: "This role has already been verified" },
        { status: 400 }
      );
    }

    // Check if verification code matches
    if (userRole.roleVerificationCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (userRole.roleVerificationExpireDate && new Date() > userRole.roleVerificationExpireDate) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify the role
    await prisma.$transaction(async (tx) => {
      // Update UserRole
      await tx.userRole.update({
        where: { id: userRoleId },
        data: {
          isRoleVerified: true,
          roleVerifiedAt: new Date(),
          roleVerificationCode: null,
          roleVerificationExpireDate: null,
        },
      });

      // Check if user has any verified roles now
      const verifiedRolesCount = await tx.userRole.count({
        where: {
          userId: userRole.userId,
          isRoleVerified: true,
        },
      });

      // If this is the first verified role, update the User table
      if (verifiedRolesCount === 1) {
        await tx.user.update({
          where: { id: userRole.userId },
          data: {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            verificationCode: null,
            verificationCodeExpireDate: null,
          },
        });
      }
    });

    // Send welcome email only if this is the user's first verified role
    const allVerifiedRoles = await prisma.userRole.findMany({
      where: { 
        userId: userRole.userId,
        isRoleVerified: true,
      },
    });

    if (allVerifiedRoles.length === 1) {
      try {
        await emailService.sendWelcomeEmail(
          email,
          userRole.user.firstName || undefined
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json({
      message: `Email verified successfully for ${userRole.role.name} role! You can now login with this role.`,
      success: true,
      userId: userRole.userId,
      userRoleId: userRoleId,
      role: userRole.role.name,
    }, { status: 200 });

  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}