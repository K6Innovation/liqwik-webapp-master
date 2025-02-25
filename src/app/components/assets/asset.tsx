"use client";

import React, {
  ChangeEvent,
  FormEvent,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import getStatusColor from "../utils/get-status-color";
import Required from "../widgets/required";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { numericFormatter } from "react-number-format";
import CloseButton from "../widgets/buttons/close-button";
import Link from "next/link";
import EditButton from "../widgets/buttons/edit-button";
import RoundBadge from "../widgets/round-badge";
import BidList from "./bid-list";

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
    bidClosingDate: string;
    auctionStatus: string;
    auctionedUnits: number;
    bids: any[];
  };
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

export default function Asset({ asset, bidAction }: Props) {
  console.log("Asset", asset);
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 items-center">
          <h1 className="text-2xl font-bold">Asset</h1>
          <Link href={`/assets/${asset.id}?edit=true`}>
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
            value={`$${numericFormatter(`${asset.faceValue}`, {
              thousandSeparator: ",",
            })}`}
          />
          <div>
            <label className="block label-text text-gray-400 mb-1">
              Allowed Units & Value
            </label>
            <div className="flex items-center">
              <RoundBadge size="xs" color={getStatusColor(asset.auctionStatus)}>
                {asset.auctionedUnits}
              </RoundBadge>
              <div className="ml-2 font-bold text-gray-800">
                $
                {numericFormatter(
                  `${Math.floor(asset.faceValue / 1000) * 1000}`,
                  {
                    thousandSeparator: ",",
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field
            label="Payment Due"
            value={dayjs(asset.paymentDate).format("DD/MM/YYYY")}
          />
          <Field
            label="Days from now"
            value={dayjs(asset.paymentDate).diff(dayjs(), "days").toString()}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field
            label="Auctioned Units"
            value={asset.auctionedUnits.toString()}
          />
          <div>
            <label className="block label-text text-gray-400 mb-1">Value</label>
            <div className="flex items-center">
              <RoundBadge size="xs" color={getStatusColor(asset.auctionStatus)}>
                {asset.auctionedUnits}
              </RoundBadge>
              <div className="ml-2 font-bold text-gray-800">
                $
                {numericFormatter(`${asset.auctionedUnits * 1000}`, {
                  thousandSeparator: ",",
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Proposed Discount"
              value={
                asset.proposedDiscount ? `${asset.proposedDiscount}%` : "-"
              }
            />
            <Field label="Effective Interest p.a." value="-" />
          </div>
          {/* <div className="text-gray-400 text-xs mb-4 italic">
            Based on Bill-to party's and your credit ratings and current market
            conditions, suggested discount is 11%
          </div> */}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field
            label="Bidding Close"
            value={dayjs(asset.bidClosingDate).format("DD/MM/YYYY")}
          />
          <Field
            label="Days from now"
            value={dayjs(asset.bidClosingDate).diff(dayjs(), "days").toString()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <BidList bids={asset.bids} bidAction={bidAction} />
      </div>
      <div className="flex flex-col gap-4 mb-4">
        <div>
          <Link href={`/`}>
            <button type="button" className="w-full bg-pink-400 text-white py-2 px-4 rounded-full">
              Close Auction
            </button>
          </Link>
        </div>
        <div>
          <Link href={`/`}>
            <button type="button" className="w-full bg-pink-700 text-white py-2 px-4 rounded-full">
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
