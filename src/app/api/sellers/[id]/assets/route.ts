import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import {getSellerOrgs} from "@/utils/api/get-user-orgs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
  const assets = await prisma.asset.findMany({
    where: {
      sellerId: {
        in: userOrgs.map((org) => org.id),
      },
    },
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Seller", 400);
    }
    const formData = await req.formData();
    const faceValueInCents = parseInt((formData.get("faceValue") || "") as string) * 100;
    if (faceValueInCents && isNaN(faceValueInCents)) {
      throw new CustomError("INVALID_REQUEST", 400);
    }
    const invoiceDate = formData.get("invoiceDate") as string;
    if (!invoiceDate) {
      throw new CustomError("Invoice Date is required", 400);
    }
    const paymentDate = formData.get("paymentDate") as string;
    if (!paymentDate) {
      throw new CustomError("Payment Date is required", 400);
    }
    // const bidClosingDate = formData.get("bidClosingDate") as string;
    // if (!bidClosingDate) {
    //   throw new CustomError("Bid Closing Date is required", 400);
    // }
    const termMonths = parseInt(formData.get("termMonths") as string);
    if (isNaN(termMonths)) {
      throw new CustomError("Term Months is required", 400);
    }
    const seller = await prisma.assetSeller.findFirst({
      where: {
        id: userOrgs[0].id,
      },
    });
    if (!seller) {
      throw new CustomError("Seller not found", 400);
    }
    const billToPartyId = formData.get("billToPartyId") as string;
    const billToParty = await prisma.billToParty.findFirst({
      where: {
        id: billToPartyId,
      },
    });
    if (!billToParty) {
      throw new CustomError("Bill To Party not found", 400);
    }
    const assetData: any = {
      invoiceNumber: formData.get("invoiceNumber"),
      invoiceDate: dayjs(invoiceDate).toDate(),
      faceValueInCents,
      paymentDate: dayjs(paymentDate).toDate(),
      // auctionedUnits: parseInt(formData.get("auctionedUnits") as string),
      termMonths: termMonths,
      // bidClosingDate: dayjs(bidClosingDate).toDate(),
    }
    const asset = await prisma.asset.create({
      data: {
        ...assetData,
        seller: {
          connect: {
            id: seller.id,
          },
        },
        billToParty: {
          connect: {
            id: billToParty.id,
          },
        },
      },
    });
    return NextResponse.json(asset);
  } catch (error: any) {
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({error: error.message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate Bill-to Party / Invoice Number" },
        { status: 400 }
      );
    }
    return NextResponse.json({error: error.message }, { status: 500 });
  }
}
