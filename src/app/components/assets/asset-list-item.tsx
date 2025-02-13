import React, { useEffect } from "react";
import getStatusColor from "../utils/get-status-color";
import Link from "next/link";
import ChevronRight from "../widgets/buttons/chevron-right";
import RoundBadge from "../widgets/round-badge";

type Props = {
  asset: any;
};

export default function AssetListItem({ asset }: Props) {
  return (
    <li className="flex items-center border-b last:border-b-0">
      <Link
        key={asset.id}
        href={`/assets/${asset.id}`}
        className="flex items-center p-2 py-4"
      >
        <RoundBadge size="md" color={getStatusColor(asset.auctionStatus)}>
          {asset.auctionedUnits}
        </RoundBadge>
        <div className="ml-4 flex-grow">
          <div className="font-semibold">
            {asset.billToParty.name} / {asset.invoiceNumber}
          </div>
          <div className="text-sm text-gray-600">
            ${asset.auctionedUnits * 1000}, {asset.numDaysForPayment}d
            {asset.bids && (
              <span className="ml-3">{asset.bids.length} bids</span>
            )}
          </div>
        </div>
        <div className="text-gray-400">
          {/* <ChevronRight className="btn-sm btn-ghost" /> */}
        </div>
      </Link>
    </li>
  );
}
