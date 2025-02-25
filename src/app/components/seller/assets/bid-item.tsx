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

  useEffect(() => {
    if (!asset || !bid) return;
    const bidAmount = (bid.numUnits * bid.centsPerUnit) / 100;
    const discount = getDiscount(asset, { totalAmount: bidAmount }) || 0;
    setBidAmount(bidAmount);
    setDiscount(discount);
    setApy(getAPY(asset, { totalAmount: bidAmount }) || 0);
  }, [asset, bid]);

  return (
    <tr className="border-t bg-white shadow-lg border border-gray-200">
  <td className="py-3 px-4 text-left text-gray-600 align-top border-r border-gray-300">
    <span className="block whitespace-normal">{bid.buyer.name}</span>
  </td>
  <td className="py-3 px-4 font-semibold text-center align-top border-r border-gray-300">
    €{bidAmount}
  </td>
  <td className="py-3 px-4 text-gray-600 italic text-center align-top border-r border-gray-300">
    {discount}%
  </td>
  <td className="py-3 px-4 text-gray-600 italic text-center align-top border-r border-gray-300">
    {apy}%
  </td>
  <td className="py-3 px-4 text-center align-top">
    <AcceptButton
      className={`btn-sm btn-ghost ${bid.accepted ? "text-success" : ""}`}
      iconStyle={bid.accepted ? "solid" : "outline"}
      onClick={() => bidAction(bid.id, bid.accepted ? "cancel-accept" : "accept")}
    />
  </td>
</tr>

    // <tr className="border-t w-full bg-white shadow-lg border border-gray-200 rounded-2xl p-6">
    //   <td className="py-2 text-sm text-gray-600">{bid.buyer.name}</td>
    //   <td className="py-2 font-semibold">€{bidAmount}</td>
    //   <td className="py-2 text-gray-600 italic">{discount}%</td>
    //   <td className="py-2 text-gray-600 italic">{apy}%</td>
    //   <td className="py-2 text-gray-400">
    //     <AcceptButton
    //       className={`btn-sm btn-ghost ${bid.accepted ? "text-success" : ""}`}
    //       iconStyle={bid.accepted ? "solid" : "outline"}
    //       onClick={() => bidAction(bid.id, bid.accepted ? "cancel-accept" : "accept")}
    //     />
    //   </td>
    // </tr>
  );
}
