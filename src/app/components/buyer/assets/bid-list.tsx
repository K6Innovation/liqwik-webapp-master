import React from "react";
import BidItem from "./bid-item";

type Props = {
  asset: any;
  bids: any[];
  bidAction: (bId: string, action: string) => void;
};

export default function BidList({ asset, bids = [], bidAction }: Props) {
  return (
    <div>
      <h1 className=" text-lg italic text-gray-500">
        {bids.length} Other Bid{bids.length === 1 ? "" : "s"}
      </h1>
      <ol className="">
        {bids.map((bid) => (
          <BidItem asset={asset} key={bid.id} bid={bid} bidAction={bidAction} />
        ))}
      </ol>
    </div>
  );
}
