"use client";

import React, { useState } from "react";

type Props = {
  setShowFilters: (value: boolean) => void;
};

export default function SearchPop({ setShowFilters }: Props) {
  const [risk, setRisk] = useState(45);
  const [term, setTerm] = useState(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md"> {/* Increased width */}
        <h2 className="text-lg font-bold text-center mb-4">Search Filters</h2>

        {/* Face Value */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="number" placeholder="Min Face Value (€)" className="input input-bordered w-full text-sm placeholder:text-xs" />
          <input type="number" placeholder="Max Face Value (€)" className="input input-bordered w-full text-sm placeholder:text-xs" />
        </div>

        {/* Option Value */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="number" placeholder="Min Option Value (€)" className="input input-bordered w-full text-sm placeholder:text-xs" />
          <input type="number" placeholder="Max Option Value (€)" className="input input-bordered w-full text-sm placeholder:text-xs" />
        </div>

        {/* Risk Slider */}
        <div className="mb-4">
          <span className="block text-gray-400 text-sm mb-1">Risk {risk}%</span>
          <input type="range" min={0} max={100} value={risk} onChange={(e) => setRisk(parseInt(e.target.value))} className="range range-md range-pink-700" />
        </div>

        {/* Term Slider */}
        <div className="mb-4">
          <span className="block text-gray-400 text-sm mb-1">Term {term} Months</span>
          <input type="range" min={1} max={12} step={1} value={term} onChange={(e) => setTerm(parseInt(e.target.value))} className="range range-md range-pink-700" />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button className="btn bg-pink-700 text-white btn-sm">Apply</button>
          <button className="btn btn-default btn-sm" onClick={() => setShowFilters(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
