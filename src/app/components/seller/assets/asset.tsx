"use client";

import dayjs from "dayjs";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { numericFormatter } from "react-number-format";
import { HiOutlineEye } from "react-icons/hi2";
import BidList from "./bid-list";
import { useSession } from "next-auth/react";
import DocumentViewer from "../../assets/document-viewer";

type Props = {
  asset: {
    id: number;
    billToPartyId: string;
    billToParty: { id: string; name: string };
    invoiceNumber: string;
    invoiceDate: string;
    faceValue: number;
    paymentDate: string;
    proposedDiscount?: number;
    auctionStatus: string;
    bids: any[];
    termMonths: number;
    apy: number;
    feeApprovedBySeller?: boolean;
    invoiceFilePath?: string;
    bankStatementFilePath?: string;
    billToPartyHistoryFilePath?: string;
  };
  editUrl: string;
  bidAction: (bId: string, action: string) => void;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="form-control w-full mb-1">
      <div className="label-text text-gray-400">{label}</div>
      <div className="font-bold text-gray-800">{value}</div>
    </label>
  );
}

export default function SellerAsset({ asset, bidAction, editUrl }: Props) {
  const [step, setStep] = useState(0);
  const [showDocuments, setShowDocuments] = useState(false);
  const session: any = useSession();
  const userRoles = session?.data?.user?.roles || [];
  
  // Calculate 1% fee based on face value
  const fee = (asset.faceValue * 0.01).toFixed(0);

  // Get first two digits of face value
  const faceValueFirstTwo = useMemo(() => {
    const faceValue = asset.faceValue?.toString() || "0";
    return faceValue.length >= 2 ? faceValue.substring(0, 2) : faceValue.padStart(2, '0');
  }, [asset.faceValue]);

  // Check if any documents are available
  const hasDocuments = asset.invoiceFilePath || asset.bankStatementFilePath || asset.billToPartyHistoryFilePath;

  return (
    <div className="mt-6 p-6 bg-white rounded-lg mb-10">
      {/* Only show token if fee is approved */}
      {asset.feeApprovedBySeller && (
        <div className="w-100 bg-white shadow-lg border border-gray-200 rounded-2xl p-6 mt-11 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Token Info</h2>
          
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <Image
                src="/Transparent-Gold-image.png"
                alt="Liqwik Gold Token"
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
      )}

      {/* Show message if fee is not approved */}
      {!asset.feeApprovedBySeller && (
        <div className="w-100 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-11">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-yellow-800">Fee Approval Pending</h2>
          </div>
          <p className="text-yellow-700">
            This invoice is pending fee approval. Once the fee is confirmed, your gold token will be activated and the invoice will appear in your Liqwik portfolio.
          </p>
        </div>
      )}

      <div>
        <div className="grid grid-cols-2 gap-4 mb-4 mt-5">
          <Field label="Bill-To Party" value={asset.billToParty.name} />
          <Field label="Term Months" value={asset.termMonths ? `${asset.termMonths} months` : "-"} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field label="Invoice Number" value={asset.invoiceNumber} />
          <Field label="Invoice Date" value={dayjs(asset.invoiceDate).format("DD/MM/YYYY")} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field
            label="Face Value"
            value={`€${numericFormatter(`${asset.faceValue}`, {
              thousandSeparator: ",",
            })}`}
          />
          <Field label="Payment Due" value={dayjs(asset.paymentDate).format("DD/MM/YYYY")} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4 mt-5">
          <Field label="Suggested Disc" value={asset.proposedDiscount ? `${asset.proposedDiscount}%` : "-"} />
          <Field label="APY" value={asset.apy ? `${asset.apy}%` : "-"} />
        </div>

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

        {/* Bid List */}
        <div className="w-full mt-5">
          <table className="w-full">
            <tbody>
              <BidList asset={asset} bids={asset.bids} bidAction={bidAction} />
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-center mt-10">
        <Link href={`/`}>
          <button
            type="button"
            className="py-2 px-4 rounded-lg shadow-md text-white bg-pink-700 hover:bg-pink-800 transition"
          >
            ← Dashboard
          </button>
        </Link>
      </div>

      <div className="mt-10"></div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        assetId={asset.id.toString()}
        isOpen={showDocuments}
        onClose={() => setShowDocuments(false)}
      />
    </div>
  );
}