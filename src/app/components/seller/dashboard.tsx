import React from "react";
import AssetList from "./assets/asset-list";

type Props = {
  assets: any[];
};

export default function SellerDashboard({ assets = [] }: Props) {
  return (
    <div className="mx-auto p-4 bg-white rounded-lg shadow-md">
      <AssetList assets={assets} />
    </div>
  );
}