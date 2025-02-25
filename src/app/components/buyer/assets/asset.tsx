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
import Required from "../../widgets/required";
import BidItem from "./bid-item";
import BidForm from "./bid-form";
import YourBid from "./your-bid";

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
  };
  editUrl: string;
  bidAction: (bId: string, action: string) => void;
};

const inputH = "h-[2.5rem] min-h-[2.5rem]";
const errorBorder = "border-pink-700";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="form-control w-full mb-1">
      <div className="label-text text-gray-400">{label}</div>
      <div className="font-bold text-gray-800">{value}</div>
    </label>
  );
}

export default function Asset({ asset, bidAction, editUrl }: Props) {
  const session = useSession();
  const [user, setUser] = useState<any>();
  const [otherBids, setOtherBids] = useState<any[]>([]);
  const [yourBid, setYourBid] = useState<any>();
  const [newBid, setNewBid] = useState<any>({
    asset,
    numUnits: 0,
    amountPerUnit: 0,
  });

  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  useEffect(() => {
    if (!user) return;
    const otherBids = asset.bids.filter(
      (b: any) => b.buyer.contact?.user?.id !== user.id
    );
    const yourBid = asset.bids.find(
      (b: any) => b.buyer.contact?.user?.id === user.id
    );
    // const yourBid = undefined;
    setOtherBids(otherBids);
    if (yourBid) setYourBid(yourBid);
  }, [user, asset]);

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
        <div className="mb-4 mt-10">
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
                <span className="italic font-normal text-gray-500">
                  {dayjs(asset.paymentDate).diff(dayjs(), "days").toString()}d
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 mb-4">
        <BidList asset={asset} bids={otherBids} bidAction={bidAction} />
      </div>

      <div className="flex flex-col gap-0 mb-4">
        <YourBid
          asset={asset}
          bid={yourBid}
          postBidAction={(bid: any) => {
            setYourBid(bid);
          }}
        />
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {/* <div>
          <Link href={`/`}>
            <button type="button" className="btn w-full">
              Go Back
            </button>
          </Link>
        </div> */}
      </div>
    </div>
  );
}
