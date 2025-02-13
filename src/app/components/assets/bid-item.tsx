import React from "react";
import AcceptButton from "../widgets/buttons/accept-button";

type Props = {
  bid: any;
  bidAction: (bId: string, action: string) => void;
};

export default function BidItem({ bid = {}, bidAction }: Props) {
  return (
    <li className="flex items-center justify-between border-b last:border-b-0">
      <div className="flex items-center py-2">
        <div className="flex-grow">
          <div className="font-semibold">
            {bid.numUnits}units @ ${bid.centsPerUnit / 100}/unit
          </div>
          <div className="text-sm text-gray-600">{bid.buyer.name}</div>
        </div>
      </div>
      <div className="text-gray-400">
        <AcceptButton
          className={`btn-sm btn-ghost ${bid.accepted ? "text-success" : ""}`}
          iconStyle={bid.accepted ? "solid" : "outline"}
          onClick={() =>
            bidAction(bid.id, bid.accepted ? "cancel-accept" : "accept")
          }
        />
      </div>
    </li>
  );
}
