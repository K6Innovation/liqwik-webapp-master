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
    <li className="flex items-center justify-between border-b last:border-b-0">
      <div className="flex items-center py-2">
        <div className="flex-grow">
          <div className="font-semibold">
            €{bidAmount}
            <span className="text-gray-600 font-normal italic">
              {" "}
              @ {discount}% discount (APY: {apy}%)
            </span>
          </div>
          <div className="text-sm text-gray-600">{bid.buyer?.name}</div>
        </div>
      </div>
      <div className="text-gray-400"></div>
    </li>
  );
}
