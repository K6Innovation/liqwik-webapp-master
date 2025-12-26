// src/app/components/seller/assets/bid-item.tsx

import React, { useEffect, useState } from "react";
import AcceptButton from "@/app/components/widgets/buttons/accept-button";
import getAPY from "../../utils/get-apy";
import getDiscount from "../../utils/get-discount";

type Props = {
  asset: any;
  bid: any;
  bidAction: (bId: string, action: string) => void;
};

export default function BidItem({ asset, bid = {}, bidAction }: Props) {
  const [bidAmount, setBidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [apy, setApy] = useState(0);
  const [fractionDisc, setFractionDisc] = useState(0);
  
  useEffect(() => {
    if (!asset || !bid) return;
    const bidAmount = (bid.numUnits * bid.centsPerUnit) / 100;
    const discount = getDiscount(asset, { totalAmount: bidAmount }) || 0;
    const fractionDisc = asset.faceValue > 0 ? ((bidAmount / asset.faceValue) * 100) : 0;

    setBidAmount(bidAmount);
    setDiscount(discount);
    setApy(getAPY(asset, { totalAmount: bidAmount }) || 0);
    setFractionDisc(fractionDisc);
  }, [asset, bid]);

  // Check if any NON-OVERDUE bid has been accepted for this asset
  const hasActiveAcceptedBid = asset.bids?.some((b: any) => 
    b.accepted && !b.isOverdue && b.id !== bid.id
  );
  
  const isThisBidAccepted = bid.accepted && !bid.isOverdue;
  const isRejected = bid.rejected;
  const isOverdue = bid.isOverdue;

  // Disable accept button if:
  // 1. Another non-overdue bid is already accepted, OR
  // 2. This bid is overdue (can't re-accept overdue bids)
  const isDisabled = (hasActiveAcceptedBid && !isThisBidAccepted) || isOverdue;

  return (
    <tr className={`border-t w-full shadow-lg border border-gray-200 rounded-2xl p-6 ${
      isOverdue ? 'bg-orange-50 opacity-70' :
      isRejected ? 'bg-red-50 opacity-60' : 
      isThisBidAccepted ? 'bg-green-50' : 
      'bg-white'
    }`}>
      <td className="py-2 text-sm text-gray-600">{bid.buyer.name}</td>
      <td className="py-2 font-semibold">€{bidAmount}</td>
      <td className="py-2 text-gray-600 italic">{discount}%</td>
      <td className="py-2 text-gray-600 italic">{fractionDisc.toFixed(2)}%</td>
      <td className="py-2 text-gray-600 italic">{apy}%</td>
      <td className="py-2 text-gray-400">
        {isOverdue ? (
          <span className="text-xs text-orange-600 font-semibold">Payment Overdue</span>
        ) : isRejected ? (
          <span className="text-xs text-red-600 font-semibold">Rejected</span>
        ) : (
          <AcceptButton
            className={`btn-sm btn-ghost ${isThisBidAccepted ? "text-success" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            iconStyle={isThisBidAccepted ? "solid" : "outline"}
            onClick={() => !isDisabled && bidAction(bid.id, isThisBidAccepted ? "cancel-accept" : "accept")}
            disabled={isDisabled}
          />
        )}
      </td>
    </tr>
  );
}