"use client";

import dayjs from "dayjs";
import Link from "next/link";
import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { numericFormatter } from "react-number-format";
import { useSession } from "next-auth/react";
import getStatusColor from "@/app/components/utils/get-status-color";
import Required from "@/app/components/widgets/required";
import CloseButton from "@/app/components/widgets/buttons/close-button";
import RoundBadge from "@/app/components/widgets/round-badge";
import getAPY from "../../utils/get-apy";

type Props = {
  asset: {
    id: string;
    billToPartyId: string;
    invoiceNumber: string;
    invoiceDate: string;
    faceValue: number;
    paymentDate: string;
    proposedDiscount?: number;
    bidClosingDate: string;
    auctionStatus: string;
    auctionedUnits: number;
    termMonths: number;
  };
  bid: {
    id: number;
    assetId: string;
    numUnits: number;
    centsPerUnit: number;
    amountPerUnit: number;
    totalAmount: number;
  };
  postSaveAction?: (asset: any) => void;
  onClose: () => void;
};

const inputH = "h-[2.5rem] min-h-[2.5rem]";
const errorBorder = "border-red-400";
const fields = [
  {
    name: "totalAmount",
    label: "Amount",
    type: "number",
    mandatory: true,
  },
];

export default function BidForm({
  asset,
  bid,
  postSaveAction,
  onClose,
}: Props) {
  const session: any = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [errorFields, setErrorFields] = useState<string[]>(
    fields.filter((field) => field.mandatory).map((field) => field.name)
  );
  const [bidCopy, setBidCopy] = useState<any>(bid);
  const [apy, setApy] = useState<number>(0);

  useEffect(() => {
    const amountPerUnit = bid?.centsPerUnit ? bid.centsPerUnit / 100 : 0;
    setBidCopy(
      bid
        ? {
            ...bid,
            amountPerUnit,
            totalAmount: bid.numUnits * amountPerUnit,
          }
        : {
            assetId: asset.id,
            numUnits: 0,
            costPerUnit: 0,
            amountPerUnit,
            totalAmount: 0,
          }
    );
  }, [bid]);

  useEffect(() => {
    const apy = getAPY(asset, bidCopy);
    setApy(apy || 0);
  }, [bidCopy, asset]);

  const onSubmit = useMemo(
    () =>
      async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setSaveStatus(null);

        try {
          const formData = new FormData(event.currentTarget);
          console.log(formData.get("totalAmount"));
          //delete invoiceImage from formData
          formData.delete("invoiceImage");
          formData.set("totalAmount", formData.get("totalAmount") as string);
          if (bid?.id) {
            formData.append("id", bid.id.toString());
          }
          const url = !bid?.id
            ? `/api/buyers/${session?.data?.user?.id}/assets/${asset.id}/bids`
            : `/api/buyers/${session?.data?.user?.id}/assets/${asset.id}/bids/${bid.id}`;
          const response = await fetch(url, {
            method: "POST",
            body: formData,
          });
          if (!response.ok) {
            const { error } = await response.json();
            throw new Error(
              error || "Failed to submit the data. Please try again."
            );
          }
          const data = await response.json();
          postSaveAction?.(data);
          setSaveStatus({
            status: "success",
            message: "Asset saved successfully",
          });
        } catch (error: any) {
          setSaveStatus({
            status: "error",
            message: error.message || "Failed to save the asset",
          });
          console.log(error);
        } finally {
          setIsLoading(false);
        }
      },
    [session, bid, postSaveAction, setSaveStatus, setIsLoading]
  );

  const updateErrorFields = useMemo(
    () =>
      function onChange(
        event: FormEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
      ) {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const errorFields = fields
          .filter((field) => field.mandatory && !formData.get(field.name))
          .map((field) => field.name);
        setErrorFields(errorFields);
        if (event.target) {
          const { name, value }: any = event.target;
          setBidCopy((prev: any) => ({ ...prev, [name]: value }));
        }
      },
    []
  );

  return (
    <>
      {bidCopy ? (
        <div className="px-4 max-w-md mx-auto bg-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold">Your Bid</h1>
            {bid && (
              <CloseButton className="btn-sm btn-ghost" onClick={onClose} />
            )}
          </div>
          <form onSubmit={onSubmit} ref={formRef}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="form-control w-full">
                <div className="label-text text-gray-400 mb-1">
                  Bid Amount
                  <Required />
                </div>
                <input
                  type="number"
                  className={`input input-bordered input-md w-full ${inputH} ${
                    errorFields.includes("totalAmount") && errorBorder
                  }`}
                  name="totalAmount"
                  onChange={updateErrorFields}
                  value={bidCopy.totalAmount || ""}
                />
              </label>
              <label className="form-control w-full">
                <div className="label-text text-gray-400 mb-3">APY</div>
                <div>
                  {bidCopy.totalAmount ? (
                    <div className="font-bold text-gray-800">{apy}%</div>
                  ) : (
                    <div className="text-gray-500">-</div>
                  )}
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-4 mb-4">
              <div>
                <button
                  type="submit"
                  className="btn w-full btn-info "
                  disabled={isLoading || errorFields.length > 0}
                >
                  Save Bid
                </button>
                {saveStatus && (
                  <div
                    className={`text-sm mt-1 italic text-${saveStatus.status}`}
                  >
                    {saveStatus.message}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
