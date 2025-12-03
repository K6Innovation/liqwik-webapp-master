// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/utils/prisma-client";
import { emailService } from "@/utils/email-service";
import crypto from "crypto";

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      middleName,
      username,
      email,
      phone,
      password,
      role,
      organizationName,
      address,
      
      // KYB Fields for Seller
      legalBusinessName,
      registrationNumber,
      taxIdentificationNumber,
      businessType,
      industrySector,
      dateOfIncorporation,
      businessBankAccountDetails,
      authorizedSignatoryDetails,
      countryOfIncorporation,
      registeredBusinessAddress,
      operatingAddress,
      websiteUrl,
      listOfDirectors,
      ultimateBeneficialOwners,
      shareholdingStructure,
      
      // KYB / Company Information for Buyer
      companyName,
      businessRegistrationNumber,
      billingAddress,
      shippingAddress,
      companyWebsite,
      preferredPaymentMethod,
      bankDetails,
      purchaseOrderNumber,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !username || !email || !password || !role || !organizationName || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate role
    if (!['seller', 'buyer'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'seller' or 'buyer'" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Get role record
    const roleRecord = await prisma.role.findUnique({
      where: { name: role }
    });

    if (!roleRecord) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    let result;
    let userRoleId;
    let isNewUser = false;

    // If user exists with same email/username
    if (existingUser) {
      // Check if user already has this role
      const hasRole = existingUser.roles.some(
        (r: any) => r.role.name === role
      );

      if (hasRole) {
        return NextResponse.json(
          { error: `You already have a ${role} account with this email` },
          { status: 409 }
        );
      }

      // Check if organization name already exists for this role
      if (role === "seller") {
        const existingSeller = await prisma.assetSeller.findUnique({
          where: { name: organizationName }
        });
        if (existingSeller) {
          return NextResponse.json(
            { error: "Organization name already exists for sellers" },
            { status: 409 }
          );
        }
      } else if (role === "buyer") {
        const existingBuyer = await prisma.assetBuyer.findUnique({
          where: { name: organizationName }
        });
        if (existingBuyer) {
          return NextResponse.json(
            { error: "Organization name already exists for buyers" },
            { status: 409 }
          );
        }
      }

      // Generate verification code for the new role
      const verificationCode = generateVerificationCode();
      const expireDate = new Date();
      expireDate.setMinutes(expireDate.getMinutes() + 15); // 15 minutes expiry

      // Add new role to existing user
      result = await prisma.$transaction(async (tx) => {
        // Create UserRole with verification code
        const userRole = await tx.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: roleRecord.id,
            isRoleVerified: false,
            roleVerificationCode: verificationCode,
            roleVerificationExpireDate: expireDate,
          },
        });

        userRoleId = userRole.id;

        // Create role-specific entity
        if (role === "seller") {
          await tx.assetSeller.create({
            data: {
              name: organizationName,
              address,
              contactId: userRole.id,
              legalBusinessName,
              registrationNumber,
              taxIdentificationNumber,
              businessType,
              industrySector,
              dateOfIncorporation: dateOfIncorporation ? new Date(dateOfIncorporation) : null,
              businessBankAccountDetails,
              authorizedSignatoryDetails,
              countryOfIncorporation,
              registeredBusinessAddress,
              operatingAddress,
              websiteUrl,
              listOfDirectors,
              ultimateBeneficialOwners,
              shareholdingStructure,
            },
          });
        } else if (role === "buyer") {
          await tx.assetBuyer.create({
            data: {
              name: organizationName,
              address,
              contactId: userRole.id,
              companyName,
              businessType,
              industrySector,
              businessRegistrationNumber,
              taxIdentificationNumber,
              billingAddress,
              shippingAddress,
              companyWebsite,
              preferredPaymentMethod,
              bankDetails,
              purchaseOrderNumber,
            },
          });
        }

        return existingUser;
      });

      // Send role verification email
      try {
        await emailService.sendVerificationEmail(email, verificationCode, firstName);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return NextResponse.json({
        message: `${role} role added successfully! Please verify your email for this role.`,
        userId: result.id,
        userRoleId: userRoleId,
        email: email,
        firstName: firstName,
        role: role,
        requiresVerification: true,
        redirectTo: `/auth/verify-email?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&role=${role}&userRoleId=${userRoleId}`
      }, { status: 201 });
    }

    // Check if organization name already exists
    if (role === "seller") {
      const existingSeller = await prisma.assetSeller.findUnique({
        where: { name: organizationName }
      });
      if (existingSeller) {
        return NextResponse.json(
          { error: "Organization name already exists for sellers" },
          { status: 409 }
        );
      }
    } else if (role === "buyer") {
      const existingBuyer = await prisma.assetBuyer.findUnique({
        where: { name: organizationName }
      });
      if (existingBuyer) {
        return NextResponse.json(
          { error: "Organization name already exists for buyers" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code for the new user
    const verificationCode = generateVerificationCode();
    const expireDate = new Date();
    expireDate.setMinutes(expireDate.getMinutes() + 15); // 15 minutes expiry

    // Create new user with role
    isNewUser = true;
    result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          middleName,
          username,
          email,
          phone,
          hashedPassword,
          isEmailVerified: false,
          verificationCode: verificationCode,
          verificationCodeExpireDate: expireDate,
        },
      });

      const userRole = await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: roleRecord.id,
          isRoleVerified: false,
          roleVerificationCode: verificationCode,
          roleVerificationExpireDate: expireDate,
        },
      });

      userRoleId = userRole.id;

      if (role === "seller") {
        await tx.assetSeller.create({
          data: {
            name: organizationName,
            address,
            contactId: userRole.id,
            legalBusinessName,
            registrationNumber,
            taxIdentificationNumber,
            businessType,
            industrySector,
            dateOfIncorporation: dateOfIncorporation ? new Date(dateOfIncorporation) : null,
            businessBankAccountDetails,
            authorizedSignatoryDetails,
            countryOfIncorporation,
            registeredBusinessAddress,
            operatingAddress,
            websiteUrl,
            listOfDirectors,
            ultimateBeneficialOwners,
            shareholdingStructure,
          },
        });
      } else if (role === "buyer") {
        await tx.assetBuyer.create({
          data: {
            name: organizationName,
            address,
            contactId: userRole.id,
            companyName,
            businessType,
            industrySector,
            businessRegistrationNumber,
            taxIdentificationNumber,
            billingAddress,
            shippingAddress,
            companyWebsite,
            preferredPaymentMethod,
            bankDetails,
            purchaseOrderNumber,
          },
        });
      }

      return newUser;
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationCode, firstName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({
      message: "Registration successful! Please check your email for verification code.",
      userId: result.id,
      userRoleId: userRoleId,
      email: email,
      firstName: firstName,
      role: role,
      requiresVerification: true,
      redirectTo: `/auth/verify-email?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&role=${role}&userRoleId=${userRoleId}`
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}