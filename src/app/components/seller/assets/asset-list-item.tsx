import React, { useEffect } from "react";
import getStatusColor from "@/app/components/utils/get-status-color";
import Link from "next/link";
import ChevronRight from "@/app/components/widgets/buttons/chevron-right";
import RoundBadge from "@/app/components/widgets/round-badge";
import CryptoIcon from "../../widgets/crypto-icon";

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
        <CryptoIcon color="gold" />

        <div className="ml-4 flex-grow">
          <div className="font-semibold">
            {asset.billToParty.name} / {asset.invoiceNumber}
          </div>
          <div className="text-sm text-gray-600">
            €{asset.faceValueInCents / 100}, {asset.numDaysForPayment}d
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
