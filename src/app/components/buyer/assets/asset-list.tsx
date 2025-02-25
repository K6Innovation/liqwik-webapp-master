import React, { useEffect, useState } from "react";
import AssetListItem from "./asset-list-item";
import SearchButton from "../../widgets/buttons/search-button";

type Props = {
  assets: any[];
};

const inputH = "h-[2.5rem] min-h-[2.5rem]";

export default function AssetList({ assets = [] }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [filteredAssets, setFilteredAssets] = useState(assets);
  const [risk, setRisk] = useState(50);
  const [term, setTerm] = useState(1);

  useEffect(() => {
    setFilteredAssets(assets);
  }, [assets]);

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md mb-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-center text-2xl font-bold">Assets</h1>
        <SearchButton
          className="btn-sm"
          onClick={() => setShowFilters(!showFilters)}
        />
      </div>
      {showFilters && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="form-control w-full">
              <div className="label-text text-gray-400 mb-1">
                Min Face Value
              </div>
              <label
                className={`input input-bordered flex items-center gap-1 ${inputH}`}
              >
                €
                <input
                  type="number"
                  className={`input input-md w-full ${inputH} focus:border-0`}
                  name="faceValue"
                />
              </label>
            </label>
            <label className="form-control w-full">
              <div className="label-text text-gray-400 mb-1">
                Max Face Value
              </div>
              <label
                className={`input input-bordered flex items-center gap-1 ${inputH}`}
              >
                €
                <input
                  type="number"
                  className={`input input-md w-full ${inputH} focus:border-0`}
                  name="faceValue"
                />
              </label>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="form-control w-full">
              <div className="label-text text-gray-400 mb-1">
                Min Option Value
              </div>
              <label
                className={`input input-bordered flex items-center gap-1 ${inputH}`}
              >
                €
                <input
                  type="number"
                  className={`input input-md w-full ${inputH} focus:border-0`}
                  name="faceValue"
                />
              </label>
            </label>
            <label className="form-control w-full">
              <div className="label-text text-gray-400 mb-1">
                Max Option Value
              </div>
              <label
                className={`input input-bordered flex items-center gap-1 ${inputH}`}
              >
                €
                <input
                  type="number"
                  className={`input input-md w-full ${inputH} focus:border-0`}
                  name="faceValue"
                />
              </label>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <label className="form-control w-full">
              <div className="label-text text-gray-400 mb-1">Risk {risk}%</div>
              <input
                type="range"
                min={0}
                max={100}
                onChange={(e) => setRisk(parseInt(e.target.value))}
                value={risk}
                className="range range-md range-accent"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <label className="form-control w-full">
              <div className="label-text text-gray-400 mb-1">
                Term {term} Months
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                onChange={(e) => setTerm(parseInt(e.target.value))}
                value={term}
                className="range range-md range-accent"
              />
            </label>
          </div>
          <div className="flex  gap-4 mb-4">
            <button className="btn bg-pink-700 text-white btn-sm">Apply</button>
            <button
              className="btn  btn-default btn-sm"
              onClick={() => setShowFilters(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ol className="">
        {filteredAssets.map((asset) => (
          <AssetListItem key={asset.id} asset={asset} />
        ))}
      </ol>
    </div>
  );
}
