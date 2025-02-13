import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import {getBuyerOrgs} from "@/utils/api/get-user-orgs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
  const assets = await prisma.asset.findMany({
    // where: {
    //   sellerId: {
    //     in: userOrgs.map((org) => org.id),
    //   },
    // },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      bids: true,
      billToParty: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  const responseObj = assets.map((asset) => {
    return {
      ...asset,
      numDaysForPayment: dayjs(asset.paymentDate).diff(dayjs(), "days"),
    };
  });
  return NextResponse.json(responseObj);
}
