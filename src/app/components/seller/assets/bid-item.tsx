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

  return (


    <tr className="border-t w-full bg-white shadow-lg border border-gray-200 rounded-2xl p-6">
      <td className="py-2 text-sm text-gray-600">{bid.buyer.name}</td>
      <td className="py-2 font-semibold">€{bidAmount}</td>
      <td className="py-2 text-gray-600 italic">{discount}%</td>
       <td className="py-2 text-gray-600 italic">{fractionDisc.toFixed(2)}%</td>
      <td className="py-2 text-gray-600 italic">{apy}%</td>
      <td className="py-2 text-gray-400">
        <AcceptButton
          className={`btn-sm btn-ghost ${bid.accepted ? "text-success" : ""}`}
          iconStyle={bid.accepted ? "solid" : "outline"}
          onClick={() => bidAction(bid.id, bid.accepted ? "cancel-accept" : "accept")}
        />
      </td>
    </tr>
  );
}
