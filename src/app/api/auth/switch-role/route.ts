// src/app/api/auth/switch-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/auth-options";
import prisma from "@/utils/prisma-client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userRoleId, roleName } = body;

    if (!userRoleId || !roleName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the user has this role and it's verified
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: {
        role: true,
        user: true,
      },
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 404 }
      );
    }

    // Check if the user ID matches
    if (userRole.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: "User does not have this role" },
        { status: 403 }
      );
    }

    // Check if the role is verified
    if (!userRole.isRoleVerified) {
      return NextResponse.json(
        { error: "This role has not been verified. Please verify your email for this role." },
        { status: 403 }
      );
    }

    // Check if the role name matches
    if (userRole.role.name !== roleName) {
      return NextResponse.json(
        { error: "Role name does not match" },
        { status: 400 }
      );
    }

    // Return success - the actual session update happens on the client
    return NextResponse.json({
      message: "Role switch validated",
      userRoleId,
      roleName,
      isVerified: userRole.isRoleVerified,
    });
  } catch (error) {
    console.error("Switch role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}