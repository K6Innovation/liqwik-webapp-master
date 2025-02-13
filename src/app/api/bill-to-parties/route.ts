import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const billTiparties = await prisma.billToParty.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  return NextResponse.json(billTiparties);
}
