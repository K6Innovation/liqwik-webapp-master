import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import bcrypt from "bcrypt";
import { emailService } from "@/utils/email-service";

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
      billToParties,
      // Seller KYB fields
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
      // Buyer fields
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
    if (!email || !username || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create role
    const roleRecord = await prisma.role.findFirst({
      where: { name: role },
    });

    if (!roleRecord) {
      return NextResponse.json(
        { error: `Role '${role}' not found` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    let user: any;
    let userRole: any;
    let roleVerificationCode: string;
    let isNewUser = false;

    if (existingUser) {
      // Check if user already has this role
      const hasRole = existingUser.roles.some(
        (ur) => ur.role.name === role
      );

      if (hasRole) {
        return NextResponse.json(
          { error: `You are already registered as a ${role}` },
          { status: 400 }
        );
      }

      // Verify password matches
      const validPassword = await bcrypt.compare(
        password,
        existingUser.hashedPassword
      );

      if (!validPassword) {
        return NextResponse.json(
          { error: "Invalid password. Please use the same password you registered with." },
          { status: 400 }
        );
      }

      // Add new role to existing user
      user = existingUser;

      const result = await prisma.$transaction(async (tx) => {
        // Create UserRole with verification code
        const newRoleVerificationCode = generateVerificationCode();
        const roleVerificationExpireDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUserRole = await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: roleRecord.id,
            isRoleVerified: false,
            roleVerificationCode: newRoleVerificationCode,
            roleVerificationExpireDate,
          },
        });

        // Create organization based on role
        if (role === "seller") {
          await tx.assetSeller.create({
            data: {
              name: organizationName,
              address,
              contactId: newUserRole.id,
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

          // Create bill-to-parties if provided
          if (billToParties && Array.isArray(billToParties) && billToParties.length > 0) {
            for (const btp of billToParties) {
              if (btp.name && btp.email && btp.address) {
                await tx.billToParty.create({
                  data: {
                    name: btp.name,
                    email: btp.email,
                    address: btp.address,
                    contactId: newUserRole.id,
                    createdByUserId: user.id,
                  },
                });
              }
            }
          }
        } else if (role === "buyer") {
          await tx.assetBuyer.create({
            data: {
              name: organizationName,
              address,
              contactId: newUserRole.id,
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

        return { userRole: newUserRole, roleVerificationCode: newRoleVerificationCode };
      });

      userRole = result.userRole;
      roleVerificationCode = result.roleVerificationCode;

    } else {
      // Create new user
      isNewUser = true;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification codes
      const userVerificationCode = generateVerificationCode();
      const userVerificationExpireDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            username,
            hashedPassword,
            firstName,
            lastName,
            middleName,
            phone,
            verificationCode: userVerificationCode,
            verificationCodeExpireDate: userVerificationExpireDate,
            isEmailVerified: false,
          },
        });

        // Create UserRole with verification code
        const newRoleVerificationCode = generateVerificationCode();
        const roleVerificationExpireDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUserRole = await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: roleRecord.id,
            isRoleVerified: false,
            roleVerificationCode: newRoleVerificationCode,
            roleVerificationExpireDate,
          },
        });

        // Create organization based on role
        if (role === "seller") {
          await tx.assetSeller.create({
            data: {
              name: organizationName,
              address,
              contactId: newUserRole.id,
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

          // Create bill-to-parties if provided
          if (billToParties && Array.isArray(billToParties) && billToParties.length > 0) {
            for (const btp of billToParties) {
              if (btp.name && btp.email && btp.address) {
                await tx.billToParty.create({
                  data: {
                    name: btp.name,
                    email: btp.email,
                    address: btp.address,
                    contactId: newUserRole.id,
                    createdByUserId: newUser.id,
                  },
                });
              }
            }
          }
        } else if (role === "buyer") {
          await tx.assetBuyer.create({
            data: {
              name: organizationName,
              address,
              contactId: newUserRole.id,
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

        return { user: newUser, userRole: newUserRole, roleVerificationCode: newRoleVerificationCode };
      });

      user = result.user;
      userRole = result.userRole;
      roleVerificationCode = result.roleVerificationCode;
    }

    // Send verification email AFTER successful registration
    try {
      await emailService.sendVerificationEmail(
        email,
        roleVerificationCode,
        firstName
      );
      console.log(`Verification email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    const message = isNewUser
      ? "Registration successful. Please check your email for verification code."
      : `${role.charAt(0).toUpperCase() + role.slice(1)} role added successfully. Please check your email for verification code.`;

    return NextResponse.json({
      message,
      email: user.email,
      firstName: user.firstName,
      role,
      userRoleId: userRole.id,
      isNewUser,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    if (error.code === "P2002") {
      // Get the target field from the error
      const target = error.meta?.target?.[0];
      if (target === "name") {
        return NextResponse.json(
          { error: "An organization with this name already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "A record with this information already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}