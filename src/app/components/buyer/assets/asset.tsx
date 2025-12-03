"use client";

import dayjs from "dayjs";
import { useEffect, useState, useMemo } from "react";
import { numericFormatter } from "react-number-format";
import BidList from "./bid-list";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { HiOutlineEye } from "react-icons/hi2";
import YourBid from "./your-bid";
import DocumentViewer from "../../assets/document-viewer";

type Props = {
  asset: {
    id: number;
    billToPartyId: string;
    billToParty: { id: string; name: string };
    invoiceNumber: string;
    invoiceDate: string;
    faceValue: number;
    faceValueInCents?: number;
    paymentDate: string;
    proposedDiscount?: number;
    termMonths?: number;
    apy?: number;
    auctionStatus: string;
    bids: any[];
    invoiceFilePath?: string;
    bankStatementFilePath?: string;
    billToPartyHistoryFilePath?: string;
  };
  editUrl: string;
  bidAction: (bId: string, action: string) => void;
};

const inputH = "h-[2.5rem] min-h-[2.5rem]";
const errorBorder = "border-pink-700";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="form-control w-full mb-1">
      <div className="label-text text-gray-400">{label}</div>
      <div className="font-bold text-gray-800">{value}</div>
    </label>
  );
}

export default function BuyerAsset({ asset, bidAction, editUrl }: Props) {
  const session = useSession();
  const [user, setUser] = useState<any>();
  const [otherBids, setOtherBids] = useState<any[]>([]);
  const [yourBid, setYourBid] = useState<any>();
  const [showDocuments, setShowDocuments] = useState(false);
  const [newBid, setNewBid] = useState<any>({
    asset,
    numUnits: 0,
    amountPerUnit: 0,
  });

  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  useEffect(() => {
    if (!user) return;
    const otherBids = asset.bids.filter(
      (b: any) => b.buyer.contact?.user?.id !== user.id
    );
    const yourBid = asset.bids.find(
      (b: any) => b.buyer.contact?.user?.id === user.id
    );
    setOtherBids(otherBids);
    if (yourBid) setYourBid(yourBid);
  }, [user, asset]);

  // Get first two digits of face value
  const faceValueFirstTwo = useMemo(() => {
    const displayFaceValue = asset.faceValueInCents 
      ? asset.faceValueInCents / 100 
      : asset.faceValue;
    const faceValueStr = displayFaceValue?.toString() || "0";
    return faceValueStr.length >= 2 ? faceValueStr.substring(0, 2) : faceValueStr.padStart(2, '0');
  }, [asset.faceValue, asset.faceValueInCents]);

  // Check if any documents are available
  const hasDocuments = asset.invoiceFilePath || asset.bankStatementFilePath || asset.billToPartyHistoryFilePath;

  return (
    <div className="mt-6 p-6 bg-white rounded-lg mb-10">
      <div className="w-100 bg-white shadow-lg border border-gray-200 rounded-2xl p-6 mt-11 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Token Info</h2>
        
        {/* Gold Token with Dynamic Overlay Values - Larger Size */}
        <div className="flex justify-center">
          <div className="relative w-64 h-64">
            <Image
              src="/Transparent-Gold-image.png"
              alt="Gold Liqwik Token"
              width={256}
              height={256}
              className="object-contain"
            />
            {/* Overlay values on the token image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Duration (top center) */}
                <div 
                  className="absolute font-bold text-xl"
                  style={{ 
                    top: '18%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#D4AF37'
                  }}
                >
                  {asset.termMonths || 0}
                </div>
                
                {/* Face Value (center right - first two digits) */}
                <div 
                  className="absolute font-bold text-2xl"
                  style={{ 
                    top: '48%',
                    left: '58%',
                    transform: 'translateY(-50%)',
                    color: '#D4AF37'
                  }}
                >
                  {faceValueFirstTwo}
                </div>
                
                {/* APY (bottom center) */}
                <div 
                  className="absolute font-bold text-xl"
                  style={{ 
                    bottom: '18%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#D4AF37'
                  }}
                >
                  {asset.apy ? asset.apy.toFixed(0) : '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <div className="mb-4 mt-10">
          <Field label="Bill-To Party" value={asset.billToParty.name} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field label="Invoice Number" value={asset.invoiceNumber} />
          <Field
            label="Invoice Date"
            value={dayjs(asset.invoiceDate).format("DD/MM/YYYY")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field
            label="Face Value"
            value={`€${numericFormatter(`${asset.faceValue}`, {
              thousandSeparator: ",",
            })}`}
          />
          <div>
            <label className="block label-text text-gray-400 mb-1">
              Payment Due
            </label>
            <div className="flex items-center">
              <div className="font-bold text-gray-800">
                {dayjs(asset.paymentDate).format("DD/MM/YYYY")}{" "}
                <span className="italic font-normal text-gray-500">
                  {dayjs(asset.paymentDate).diff(dayjs(), "days").toString()}d
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Documents Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowDocuments(true)}
            disabled={!hasDocuments}
            className={`flex items-center justify-between border rounded-md p-3 w-full shadow-sm transition ${
              hasDocuments
                ? "border-gray-300 hover:bg-gray-50 cursor-pointer"
                : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
            }`}
          >
            <span className="text-gray-700">
              {hasDocuments ? "View Documents" : "No Documents Available"}
            </span>
            {hasDocuments && (
              <div className="border-l border-gray-300 pl-3">
                <HiOutlineEye className="w-6 h-6 text-gray-600" />
              </div>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 mb-4 mt-5">
        <BidList asset={asset} bids={otherBids} bidAction={bidAction} />
      </div>

      <div className="flex flex-col gap-0 mb-4">
        <YourBid
          asset={asset}
          bid={yourBid}
          postBidAction={(bid: any) => {
            setYourBid(bid);
          }}
        />
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {/* <div>
          <Link href={`/`}>
            <button type="button" className="btn w-full">
              Go Back
            </button>
          </Link>
        </div> */}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        assetId={asset.id.toString()}
        isOpen={showDocuments}
        onClose={() => setShowDocuments(false)}
      />
    </div>
  );
}