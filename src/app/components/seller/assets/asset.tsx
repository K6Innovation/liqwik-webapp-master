"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { numericFormatter } from "react-number-format";
import getStatusColor from "@/app/components/utils/get-status-color";
import CloseButton from "@/app/components/widgets/buttons/close-button";
import EditButton from "@/app/components/widgets/buttons/edit-button";
import RoundBadge from "@/app/components/widgets/round-badge";
import BidList from "./bid-list";
import { useSession } from "next-auth/react";

type Props = {
  asset: {
    id: number;
    billToPartyId: string;
    billToParty: { id: string; name: string };
    invoiceNumber: string;
    invoiceDate: string;
    faceValue: number;
    paymentDate: string;
    proposedDiscount?: number;
    // bidClosingDate: string;
    auctionStatus: string;
    // auctionedUnits: number;
    bids: any[];
    termMonths: number;
    apy: number;
  };
  editUrl: string;
  bidAction: (bId: string, action: string) => void;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="form-control w-full mb-1">
      <div className="label-text text-gray-400">{label}</div>
      <div className="font-bold text-gray-800">{value}</div>
    </label>
  );
}

export default function Asset({ asset, bidAction, editUrl }: Props) {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
       <div className="w-100 bg-white shadow-lg border border-gray-200 rounded-2xl p-6 mt-11 space-y-4">
            <h2 className=" text-base font-semibold text-gray-800">Token Info</h2>
            <img 
              src="/liqwik-token.png" 
              alt="Card Image" 
              className="w-32 h-32 object-cover mx-auto rounded-lg"
            /></div>
      <div>
        <div className="grid grid-cols-2 gap-4 mb-4 mt-5">
          <Field label="Bill-To Party" value={asset.billToParty.name} />
          <Field label="Term Months" value={asset.termMonths ? `${asset.termMonths} months` : "-"} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field label="Invoice Number" value={asset.invoiceNumber} />
          <Field
            label="Invoice Date"
            value={dayjs(asset.invoiceDate).format("DD/MM/YYYY")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field
            label="Face Value"
            value={`€${numericFormatter(`${asset.faceValue}`, {
              thousandSeparator: ",",
            })}`}
          />
          <div>
            <label className="block label-text text-gray-400 mb-1">
              Payment Due
            </label>
            <div className="flex items-center">
              {/* <RoundBadge size="xs" color={getStatusColor(asset.auctionStatus)}>
                {asset.auctionedUnits}
              </RoundBadge> */}
              <div className="font-bold text-gray-800">
                {dayjs(asset.paymentDate).format("DD/MM/YYYY")}{" "}
                <span className="italic text-gray-500">
                  {dayjs(asset.paymentDate).diff(dayjs(), "days").toString()}d
                </span>
              </div>
            </div>
          </div>
        </div>
      
      <div className="w-full">
      <table className="w-full">
        <tbody><BidList asset={asset} bids={asset.bids} bidAction={bidAction} />
        </tbody>
      </table>
    </div>
      </div>

      {/* <div className="flex flex-col gap-4 mb-4">
        <BidList asset={asset} bids={asset.bids} bidAction={bidAction} />
      </div> */}
      <div className="flex flex-col gap-4 mb-4 mt-5">
        <div>
          <Link href={`/`}>
            <button type="button" className="w-full bg-pink-700 text-white py-2 px-4 rounded-full">
              Accept
            </button>
          </Link>
        </div>
        <div className="mb-10">
          {/* <Link href={`/`}>
            <button type="button" className="btn w-full">
              Go Back
            </button>
          </Link> */}
        </div>
      </div>
    </div>
  );
}
