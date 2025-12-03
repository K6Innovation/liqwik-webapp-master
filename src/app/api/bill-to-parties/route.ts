// src/app/api/bill-to-parties/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const billToParties = await prisma.billToParty.findMany({
    select: {
      id: true,
      name: true,
      email: true, // Include email field
    },
  });
  return NextResponse.json(billToParties);
}