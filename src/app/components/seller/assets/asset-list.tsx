import React from "react";
import { HiOutlineViewGrid, HiOutlineShoppingCart, HiOutlineUser, HiOutlineHome } from "react-icons/hi";
import { FiPlus } from "react-icons/fi";
import AssetListItem from "./asset-list-item";
import SearchButton from "../../widgets/buttons/search-button";
import Link from "next/link";

type Props = {
  assets: any[];
};

export default function AssetList({ assets = [] }: Props) {
  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-center text-2xl font-bold">Assets</h1>
          <SearchButton className="btn-sm" />
        </div>
        <ol>
          {assets.map((asset) => (
            <AssetListItem key={asset.id} asset={asset} />
          ))}
        </ol>
      </div>
      <div className="text-center mt-4">
        <Link href="/assets/new">
          <button type="button" className="w-40 bg-pink-700 text-white py-2 px-4 rounded-full">Create Liqwik</button>
        </Link>
      </div>
    </div>
  );
}
