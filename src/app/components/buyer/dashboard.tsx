import React, { useEffect } from "react";
import AssetList from "./assets/asset-list";

type Props = {
  assets: any[];
};

export default function BuyerDashboard({ assets = [] }: Props) {
  return (
    <div className="mx-auto p-4  bg-white rounded-lg shadow-md ">
      <AssetList assets={assets} />
    </div>
  );
}
