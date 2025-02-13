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
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 items-center">
          <h1 className="text-2xl font-bold">Asset</h1>
          <Link href={editUrl}>
            <EditButton className="btn-sm btn-ghost" />
          </Link>
        </div>
        <Link href="/">
          <CloseButton className="btn-sm btn-ghost" />
        </Link>
      </div>
      <div>
        <div className="mb-4">
          <Field label="Bill-To Party" value={asset.billToParty.name} />
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

        <div className="grid gap-1 mb-4">
          <button type="button" className="btn btn-primary w-full btn-outline">
            View Invoice
          </button>
        </div>

        <div className="grid gap-1 mb-4">
          <button type="button" className="btn btn-primary w-full btn-outline">
            View Bank Statememt
          </button>
        </div>

        <div className="grid gap-1 mb-4">
          <button type="button" className="btn btn-primary w-full btn-outline">
            View Bill to Party History
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-2">
          <Field
            label="Suggested Disc"
            value={asset.proposedDiscount ? `${asset.proposedDiscount}%` : "-"}
          />
          <div>
            <label className="block label-text text-gray-400 mb-1">
              Term Months
            </label>
            <div className="flex items-center">
              <div className="font-bold text-gray-800">
                {asset.termMonths || "-"}{" "}
                {asset.termMonths && (
                  <span className="font-normal">months</span>
                )}
              </div>
            </div>
          </div>
          <Field label="APY" value={asset.apy ? `${asset.apy}%` : "-"} />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <BidList asset={asset} bids={asset.bids} bidAction={bidAction} />
      </div>
      <div className="flex flex-col gap-4 mb-4">
        <div>
          <Link href={`/`}>
            <button type="button" className="btn btn-info w-full">
              Close Auction
            </button>
          </Link>
        </div>
        <div>
          <Link href={`/`}>
            <button type="button" className="btn btn-error w-full">
              Withdraw Auction
            </button>
          </Link>
        </div>
        <div>
          <Link href={`/`}>
            <button type="button" className="btn w-full">
              Go Back
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
