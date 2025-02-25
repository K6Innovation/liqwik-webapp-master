import React from "react";
import BidItem from "./bid-item";

type Props = {
  asset: any;
  bids: any[];
  bidAction: (bId: string, action: string) => void;
};

export default function BidList({ asset, bids = [], bidAction }: Props) {
  return (
    <div className="text-left mt-5">
      {/* <h1 className="text-lg font-bold italic">{bids.length} Bids</h1> */}
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-300 px-4 py-2">Name</th>
            <th className="border border-gray-300 px-4 py-2">Amount</th>
            <th className="border border-gray-300 px-4 py-2">Disc</th>
            <th className="border border-gray-300 px-4 py-2">APY</th>
            <th className="border border-gray-300 px-4 py-2">Accept</th>
          </tr>
        </thead>

        <tbody>
          {bids.map((bid) => (
            <BidItem asset={asset} key={bid.id} bid={bid} bidAction={bidAction} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
