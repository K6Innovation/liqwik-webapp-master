import React, { useEffect } from "react";
import AssetListItem from "./asset-list-item";
import AddButton from "@/app/components/widgets/buttons/add-button";
import Link from "next/link";
import SearchButton from "../../widgets/buttons/search-button";

type Props = {
  assets: any[];
};

export default function AssetList({ assets = [] }: Props) {
  return (
    <div>
      <div className="w-100 p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-center text-2xl font-bold">Assets</h1>
          <SearchButton className="btn-sm" />
        </div>
        <ol className="">
          {assets.map((asset) => (
            <AssetListItem key={asset.id} asset={asset} />
          ))}
        </ol>
      </div>
      <div className="text-center mt-4">
        <Link href="/assets/new">
          <button className="btn btn-primary btn-sm">Add Asset</button>
        </Link>
      </div>
    </div>
  );
}
