"use client";

import React, {
  ChangeEvent,
  FormEvent,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import getStatusColor from "../utils/get-status-color";
import Required from "../widgets/required";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { numericFormatter } from "react-number-format";
import CloseButton from "../widgets/buttons/close-button";
import Link from "next/link";
import RoundBadge from "../widgets/round-badge";

type Props = {
  asset: {
    id: number;
    billToPartyId: string;
    invoiceNumber: string;
    invoiceDate: string;
    faceValue: number;
    paymentDate: string;
    proposedDiscount?: number;
    // bidClosingDate: string;
    auctionStatus: string;
    // auctionedUnits: number;
    termMonths: number;
    apy: number;
  };
  postSaveAction?: (asset: any) => void;
};

const inputH = "h-[2.5rem] min-h-[2.5rem]";
const errorBorder = "border-red-400";
const fields = [
  {
    name: "invoiceNumber",
    label: "Invoice Number",
    type: "text",
    mandatory: true,
  },
  {
    name: "invoiceDate",
    label: "Invoice Date",
    type: "date",
    mandatory: true,
  },
  {
    name: "billToPartyId",
    label: "Bill-To Party",
    type: "select",
    mandatory: true,
  },
  {
    name: "faceValue",
    label: "Face Value",
    type: "number",
    mandatory: true,
  },
  {
    name: "paymentDate",
    label: "Payment Due",
    type: "date",
    mandatory: true,
  },
  {
    name: "termMonths",
    label: "Term Months",
    type: "number",
    mandatory: true,
  },
  {
    name: "proposedDiscount",
    label: "Proposed Discount",
    type: "number",
  },
  // {
  //   name: "bidClosingDate",
  //   label: "Bidding Close",
  //   type: "date",
  //   mandatory: true,
  // },
];

export default function AssetForm({ asset, postSaveAction }: Props) {
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
  const [billToParties, setBillToParties] = useState<any[]>([]);
  const [assetCopy, setAssetCopy] = useState(asset);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/bill-to-parties`).then((res) =>
        res.json()
      );
      setBillToParties(response);
      updateErrorFields({} as any);
    })();
  }, [session]);

  useEffect(() => {
    setAssetCopy(asset);
  }, [asset]);

  const onSubmit = useMemo(
    () =>
      async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setSaveStatus(null);

        try {
          const formData = new FormData(event.currentTarget);
          // //delete invoiceImage from formData
          formData.delete("invoiceImage");
          if (asset.id) {
            formData.append("id", asset.id.toString());
          }
          const url = !asset.id
            ? `/api/sellers/${session?.data?.user?.id}/assets`
            : `/api/sellers/${session?.data?.user?.id}/assets/${asset.id}`;
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
    [session, asset, postSaveAction, setSaveStatus, setIsLoading]
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
          setAssetCopy((prev) => ({ ...prev, [name]: value }));
        }
      },
    []
  );

  const onDateChange = useMemo(
    () =>
      function onDateChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        const date = dayjs(value);
        setAssetCopy((prev) => ({ ...prev, [name]: date }));
        updateErrorFields(event);
      },
    []
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">
          {!asset.id ? "New Asset" : "Edit Asset"}
        </h1>
        <Link href={!asset.id ? "/" : `/assets/${asset.id}`}>
          <CloseButton className="btn-sm btn-ghost" />
        </Link>
      </div>
      <form onSubmit={onSubmit} ref={formRef}>
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Bill-To Party
              <Required />
            </div>
            <select
              className={`
                select select-bordered w-full ${inputH}
                ${errorFields.includes("billToPartyId") && errorBorder}
              `}
              name="billToPartyId"
              onChange={updateErrorFields}
              value={assetCopy.billToPartyId || ""}
            >
              {billToParties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Invoice Number
              <Required />
            </div>
            <input
              type="text"
              className={`
                input input-bordered input-md w-full ${inputH}
                ${errorFields.includes("invoiceNumber") && errorBorder}
              `}
              name="invoiceNumber"
              onChange={updateErrorFields}
              value={assetCopy.invoiceNumber || ""}
            />
          </label>
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Invoice Date
              <Required />
            </div>
            <input
              type="date"
              className={`input input-bordered input-md w-full ${inputH} ${
                errorFields.includes("invoiceDate") && errorBorder
              }`}
              name="invoiceDate"
              onChange={onDateChange}
              value={dayjs(assetCopy.invoiceDate).format("YYYY-MM-DD") || ""}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Face Value
              <Required />
            </div>
            <label
              className={`input input-bordered flex items-center gap-1 ${inputH} ${
                errorFields.includes("faceValue") && errorBorder
              }`}
            >
              €
              <input
                type="text"
                className={`input input-md w-full ${inputH} focus:border-0`}
                name="faceValue"
                onChange={updateErrorFields}
                value={assetCopy.faceValue || ""}
              />
            </label>
          </label>
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Payment Due
              <Required />
              <span className="ml-2">
                {assetCopy.paymentDate
                  ? dayjs(assetCopy.paymentDate).diff(dayjs(), "days")
                  : ""}
                d
              </span>
            </div>
            <input
              type="date"
              className={`input input-bordered input-md w-full ${inputH} ${
                errorFields.includes("paymentDate") && errorBorder
              }`}
              name="paymentDate"
              onChange={onDateChange}
              value={dayjs(assetCopy.paymentDate).format("YYYY-MM-DD") || ""}
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Upload Invoice
              <Required />
            </div>
            <input
              type="file"
              className={`
                file-input file-input-bordered file-input-sm w-full ${inputH}
                ${errorFields.includes("invoiceNumber") && errorBorder}
              `}
              name="invoiceImage"
              onChange={updateErrorFields}
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Upload 12 Months Bank Statement
              <Required />
            </div>
            <input
              type="file"
              className={`
                file-input file-input-bordered file-input-sm w-full ${inputH}
                ${errorFields.includes("invoiceNumber") && errorBorder}
              `}
              name="invoiceImage"
              onChange={updateErrorFields}
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Upload Bill to party history
              <Required />
            </div>
            <input
              type="file"
              className={`
                file-input file-input-bordered file-input-sm w-full ${inputH}
                ${errorFields.includes("billtoParyyHistory") && errorBorder}
              `}
              name="invoiceImage"
              onChange={updateErrorFields}
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">Suggested Disc</div>
            <label
              className={`input input-bordered flex items-center gap-1 ${inputH}`}
            >
              <input
                type="number"
                className={`input input-md w-full ${inputH} focus:border-0`}
                name="proposedDiscount"
                onChange={updateErrorFields}
                value={assetCopy.proposedDiscount || ""}
              />
              %
            </label>
          </label>
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Term Months
              <Required />
            </div>
            <input
              type="number"
              className={`input input-bordered input-md w-full ${inputH}
              ${errorFields.includes("termMonths") && errorBorder}`}
              name="termMonths"
              onChange={updateErrorFields}
              value={assetCopy.termMonths || ""}
            />
          </label>
          <div>
            <label className="block label-text text-gray-400 mb-3">APY</label>
            <div className="flex items-center">
              <span className="ml-2">%</span>
            </div>
          </div>{" "}
        </div>
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <button
              type="submit"
              className="btn w-full btn-info "
              // disabled={isLoading || errorFields.length > 0}
            >
              Validate
            </button>
          </div>
          <div>
            <button
              type="submit"
              className="btn w-full btn-primary "
              // disabled={isLoading || errorFields.length > 0}
            >
              Create Liqwik Token
            </button>
            {saveStatus && (
              <div className={`text-sm mt-1 italic text-${saveStatus.status}`}>
                {saveStatus.message}
              </div>
            )}
          </div>
          <div>
            <Link href={!asset.id ? "/" : `/assets/${asset.id}`}>
              <button type="button" className="btn w-full">
                Go Back
              </button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
