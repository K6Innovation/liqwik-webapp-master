import React, { useEffect, useState } from "react";
import EditButton from "@/app/components/widgets/buttons/edit-button";
import BidForm from "./bid-form";
import getAPY from "../../utils/get-apy";
import getDiscount from "../../utils/get-discount";

type Props = {
  asset: any;
  bid?: any;
  postBidAction: (bid: any) => void;
};

export default function YourBid({ asset, bid, postBidAction }: Props) {
  const [bidAmount, setBidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [showBidForm, setShowBidForm] = useState(!bid);
  const [apy, setApy] = useState(0);

  useEffect(() => {
    if (!asset || !bid) return;
    const bidAmount =
      bid.totalAmount || (bid.numUnits * bid.centsPerUnit) / 100;
    // const discount = Math.ceil((bidAmount / asset.faceValue) * 100);
    const discount = getDiscount(asset, { totalAmount: bidAmount }) || 0;
    setBidAmount(bidAmount);
    setDiscount(discount);
    setApy(getAPY(asset, { totalAmount: bidAmount }) || 0);
  }, [asset, bid]);

  useEffect(() => {
    setShowBidForm(!bid);
  }, [bid]);

  return (
    <>
      {showBidForm ? (
        <BidForm
          asset={asset}
          bid={bid}
          onClose={() => setShowBidForm(false)}
          postSaveAction={(bid: any) => {
            setShowBidForm(false);
            postBidAction?.(bid);
          }}
        />
      ) : (
        <div>
          <div>
            <h1 className="text-lg italic text-gray-500">Your Bid</h1>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-300 px-4 py-2">Name</th>
                <th className="border border-gray-300 px-4 py-2">Amount</th>
                <th className="border border-gray-300 px-4 py-2">Disc</th>
                <th className="border border-gray-300 px-4 py-2">APY</th>
                <th className="border border-gray-300 px-4 py-2">Edit</th>
              </tr>
            </thead>
          <tr className="border-t bg-white shadow-lg border border-gray-200">
      <td className="py-3 px-4 text-left text-gray-600 align-top border-r border-gray-300">
        <span className="block whitespace-normal">{bid.buyer?.name}</span>
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
      <EditButton
                className={`btn-sm btn-ghost `}
                onClick={() => setShowBidForm(true)}
              />
      </td>
    </tr>
    </table>
          {/* <div className="flex items-center justify-between">
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
            <div className="text-gray-400">
              <EditButton
                className={`btn-sm btn-ghost `}
                onClick={() => setShowBidForm(true)}
              />
            </div>
          </div> */}
        </div>
      )}
    </>
  );
}
