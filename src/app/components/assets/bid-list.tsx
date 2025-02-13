import React from "react";
import BidItem from "./bid-item";

type Props = {
  bids: any[];
  bidAction: (bId: string, action: string) => void;
};

export default function BidList({ bids = [], bidAction }: Props) {
  return (
    <div>
      <h1 className=" text-lg font-bold">{bids.length} Bids</h1>
      <ol className="">
        {bids.map((bid) => (
          <BidItem key={bid.id} bid={bid} bidAction={bidAction} />
        ))}
      </ol>
    </div>
  );
}
