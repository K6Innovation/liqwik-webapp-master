import React, { useEffect } from "react";
import AssetListItem from "./asset-list-item";
import AddButton from "../widgets/buttons/add-button";
import { redirect } from "next/navigation";
import Link from "next/link";

type Props = {
  assets: any[];
};

export default function AssetList({ assets = [] }: Props) {
  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-center text-2xl font-bold">Assets</h1>
        <Link href="/assets/new">
          <AddButton className="btn-sm" />
        </Link>
      </div>
      <ol className="">
        {assets.map((asset) => (
          <AssetListItem key={asset.id} asset={asset} />
        ))}
      </ol>
    </div>
  );
}
