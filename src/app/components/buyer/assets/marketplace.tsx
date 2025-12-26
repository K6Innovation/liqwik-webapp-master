// src/app/components/buyer/assets/marketplace.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Props = {
  assets: any[];
};

export default function MarketList({ assets = [] }: Props) {
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter marketplace: Show assets with no bids, pending bids, OR can accept other bids
  const filterMarketplaceAssets = (assetList: any[]) => {
    return assetList.filter(asset => {
      // Must be fee approved, posted, and not cancelled
      if (!asset.feeApprovedBySeller || !asset.isPosted || asset.isCancelled) {
        return false;
      }
      
      // Show if: 
      // 1. No accepted bids at all
      // 2. OR has overdue bid and no active accepted bid (canAcceptOtherBids)
      const hasActiveAcceptedBid = asset.bids && asset.bids.some((bid: any) => 
        bid.accepted && !bid.isOverdue
      );
      
      return !hasActiveAcceptedBid || asset.canAcceptOtherBids;
    });
  };

  const getBillToParties = () => {
    const parties = new Set();
    const validAssets = assets.filter(asset => 
      asset.feeApprovedBySeller && 
      asset.isPosted && 
      !asset.isCancelled &&
      (!asset.bids || !asset.bids.some((bid: any) => bid.accepted && !bid.isOverdue) || asset.canAcceptOtherBids)
    );
    validAssets.forEach(asset => {
      if (asset.billToParty && asset.billToParty.name) {
        parties.add(asset.billToParty.name);
      }
    });
    return Array.from(parties) as string[];
  };

  useEffect(() => {
    let filtered = filterMarketplaceAssets(assets);

    if (selectedParties.length > 0) {
      filtered = filtered.filter(asset => 
        selectedParties.includes(asset.billToParty.name)
      );
    }

    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(asset => {
        const invoiceDate = new Date(asset.invoiceDate);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && invoiceDate < startDate) return false;
        if (endDate && invoiceDate > endDate) return false;
        return true;
      });
    }

    setFilteredAssets(filtered);
  }, [assets, selectedParties, dateRange]);

  const handlePartyToggle = (party: string) => {
    setSelectedParties(prev => 
      prev.includes(party) 
        ? prev.filter(p => p !== party)
        : [...prev, party]
    );
  };

  const resetFilters = () => {
    setSelectedParties([]);
    setDateRange({ start: '', end: '' });
    setIsDropdownOpen(false);
  };

  const getBidStatus = (asset: any) => {
    if (!asset.bids || asset.bids.length === 0) return { 
      total: 0, 
      accepted: 0, 
      pending: 0,
      hasAcceptedBid: false,
      hasOverdueBid: false,
      canAcceptOtherBids: false
    };
    
    const activeAccepted = asset.bids.filter((bid: any) => bid.accepted && !bid.isOverdue).length;
    const total = asset.bids.length;
    const pending = asset.bids.filter((bid: any) => !bid.accepted && !bid.rejected && !bid.isOverdue).length;
    const hasOverdueBid = asset.bids.some((bid: any) => bid.isOverdue);
    
    return { 
      total, 
      accepted: activeAccepted, 
      pending,
      hasAcceptedBid: activeAccepted > 0,
      hasOverdueBid,
      canAcceptOtherBids: asset.canAcceptOtherBids || false
    };
  };

  const selectAllParties = () => {
    setSelectedParties(getBillToParties());
  };

  const selectNoneParties = () => {
    setSelectedParties([]);
  };

  const getFaceValueFirstTwo = (faceValue: number) => {
    const faceValueStr = faceValue?.toString() || "0";
    return faceValueStr.length >= 2 ? faceValueStr.substring(0, 2) : faceValueStr.padStart(2, '0');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-lg font-semibold text-pink-800">Filters</h2>
            </div>
            <button
              onClick={resetFilters}
              className="text-pink-600 hover:text-pink-700 text-sm flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All
            </button>
          </div>

          <div className="space-y-4">
            {/* Date Range Filter */}
            <div>
              <h3 className="text-sm font-medium text-pink-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date Range
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full border border-pink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full border border-pink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Bill-to Parties Filter */}
            <div className="relative">
              <h3 className="text-sm font-medium text-pink-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Bill-to Parties ({selectedParties.length}/{getBillToParties().length})
              </h3>
              
              <div className="mb-2">
                {selectedParties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedParties.map(party => (
                      <span
                        key={party}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm"
                      >
                        {party}
                        <button
                          onClick={() => handlePartyToggle(party)}
                          className="ml-1.5 text-pink-200 hover:text-white transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-2">No parties selected</div>
                )}
              </div>

              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-pink-200 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              >
                <span className="text-sm text-gray-700">
                  {selectedParties.length === 0 ? 'Select parties...' : 
                   selectedParties.length === getBillToParties().length ? 'All parties selected' :
                   `${selectedParties.length} selected`}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-pink-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                  <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 flex justify-between">
                    <button
                      onClick={selectAllParties}
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={selectNoneParties}
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {getBillToParties().map(party => (
                    <label
                      key={party}
                      className="flex items-center px-3 py-2 hover:bg-pink-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParties.includes(party)}
                        onChange={() => handlePartyToggle(party)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{party}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-pink-700">
                Showing {filteredAssets.length} of {filterMarketplaceAssets(assets).length} posted invoices
              </span>
              {filteredAssets.length > 0 && (
                <span className="text-xs text-gray-500">
                  Click on any invoice to view details
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-4">
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => {
              const bidStatus = getBidStatus(asset);
              const faceValueFirstTwo = getFaceValueFirstTwo(asset.faceValueInCents ? asset.faceValueInCents / 100 : 0);
              
              return (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl hover:border-pink-200 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center p-5">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src="/Transparent-Gold-image.png"
                          alt="Gold Liqwik Token"
                          width={80}
                          height={80}
                          className="object-contain drop-shadow-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div 
                              className="absolute font-bold text-[9px]"
                              style={{ 
                                top: '18%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: '#D4AF37'
                              }}
                            >
                              {asset.termMonths || 0}
                            </div>
                            
                            <div 
                              className="absolute font-bold text-[11px]"
                              style={{ 
                                top: '48%',
                                left: '58%',
                                transform: 'translateY(-50%)',
                                color: '#D4AF37'
                              }}
                            >
                              {faceValueFirstTwo}
                            </div>
                            
                            <div 
                              className="absolute font-bold text-[9px]"
                              style={{ 
                                bottom: '18%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: '#D4AF37'
                              }}
                            >
                              {asset.apy ? asset.apy.toFixed(0) : '0'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-5 flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-bold text-lg text-gray-900 truncate">
                            {asset.billToParty.name}
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="text-sm font-medium text-gray-600">
                            #{asset.invoiceNumber}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-gray-900">
                              €{((asset.faceValueInCents || 0) / 100).toLocaleString()}
                            </span>
                          </div>
                          
                          <span className="text-gray-300">|</span>
                          
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">
                              {Math.abs(asset.numDaysForPayment || 0)} days
                            </span>
                          </div>

                          <span className="text-gray-300">|</span>
                          
                          {bidStatus.total === 0 ? (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <span>No bids yet</span>
                            </div>
                          )
                          // ) : 
                          // bidStatus.pending > 0 || bidStatus.canAcceptOtherBids ? (
                          //   <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                          //     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          //     </svg>
                          //     <span>{bidStatus.pending} pending</span>
                          //     <span className="text-gray-400">({bidStatus.total} total)</span>
                          //   </div>
                          // ) 
                          : (
                            <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>{bidStatus.total} bids</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-pink-500 flex-shrink-0 ml-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100">
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No posted invoices available</h3>
                <p className="mt-2 text-sm text-gray-500">Posted invoices with no active bids or accepting new bids will appear here.</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-12"></div>
      </div>
    </div>
  );
}