import React, { useEffect } from "react";
import AssetList from "./assets/asset-list";

type Props = {
  assets: any[];
};

export default function SellerDashboard({ assets = [] }: Props) {
  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="max-w-md mx-auto p-4 bg-white rounded-lg">
        <img
          src="/assets_bar_chart.png"
          alt="Loading..."
          width="100%"
          height="auto"
        />
      </div>
      <AssetList assets={assets} />
    </div>
  );
}
