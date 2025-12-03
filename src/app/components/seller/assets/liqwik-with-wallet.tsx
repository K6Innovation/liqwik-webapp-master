// src/app/components/seller/assets/liqwik-with-wallet.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Coins, CheckCircle2, Clock, XCircle } from 'lucide-react';

type Props = {
  assets: any[];
};

export default function LiqwikWithWallet({ assets = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'liqwik' | 'wallet'>('liqwik');
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

  const getBillToParties = () => {
    const parties = new Set();
    const relevantAssets = assets.filter(asset => 
      asset.feeApprovedBySeller && (asset.isPosted || asset.isCancelled)
    );
    relevantAssets.forEach(asset => {
      if (asset.billToParty && asset.billToParty.name) {
        parties.add(asset.billToParty.name);
      }
    });
    return Array.from(parties) as string[];
  };

  // Apply filters - only show posted or cancelled assets
  useEffect(() => {
    let filtered = [...assets].filter(asset => 
      asset.feeApprovedBySeller === true && (asset.isPosted === true || asset.isCancelled === true)
    );

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

  const selectAllParties = () => {
    setSelectedParties(getBillToParties());
  };

  const selectNoneParties = () => {
    setSelectedParties([]);
  };

  const postedAndCancelledCount = assets.filter(asset => 
    asset.feeApprovedBySeller === true && (asset.isPosted === true || asset.isCancelled === true)
  ).length;

  // Wallet calculations
  const approvedAssets = assets.filter(asset => asset.feeApprovedBySeller === true);
  
  const greenTokens = approvedAssets.filter(asset => 
    !asset.isPosted && !asset.isCancelled
  );

  const greyTokens = approvedAssets.filter(asset => asset.isPosted === true);

  const blackTokens = approvedAssets.filter(asset => 
    asset.isCancelled === true && !asset.isPosted
  );

  const totalGreenFees = greenTokens.reduce(
    (sum, asset) => sum + ((asset.faceValueInCents || 0) / 100) * 0.01,
    0
  );

  const totalGreyFees = greyTokens.reduce(
    (sum, asset) => sum + ((asset.faceValueInCents || 0) / 100) * 0.01,
    0
  );

  const totalBlackFees = blackTokens.reduce(
    (sum, asset) => sum + ((asset.faceValueInCents || 0) / 100) * 0.01,
    0
  );

  const getFirstTwoDigits = (value: number) => {
    const valueStr = value.toString().replace(/\D/g, '');
    return valueStr.length >= 2 ? valueStr.substring(0, 2) : valueStr.padStart(2, '0');
  };

  const getBidStatus = (asset: any) => {
    if (!asset.bids || asset.bids.length === 0) return { 
      total: 0, 
      accepted: 0, 
      pending: 0, 
      hasAcceptedBid: false, 
      paymentDeadline: null,
      paymentApproved: false,
      paymentApprovedAt: null
    };
    
    const accepted = asset.bids.filter((bid: any) => bid.accepted).length;
    const total = asset.bids.length;
    const pending = total - accepted;
    const acceptedBid = asset.bids.find((bid: any) => bid.accepted);
    
    return { 
      total, 
      accepted, 
      pending,
      hasAcceptedBid: accepted > 0,
      paymentDeadline: acceptedBid?.paymentDeadline || null,
      paymentApproved: acceptedBid?.paymentApprovedByBuyer || false,
      paymentApprovedAt: acceptedBid?.paymentApprovedAt || null
    };
  };

  const getPaymentCountdown = (paymentDeadline: string | null, paymentApproved: boolean) => {
    if (!paymentDeadline) return null;
    
    if (paymentApproved) {
      return { expired: false, text: "Payment Received", urgent: false, completed: true };
    }
    
    const deadline = new Date(paymentDeadline);
    const diff = deadline.getTime() - currentTime.getTime();
    
    if (diff <= 0) {
      return { expired: true, text: "Payment overdue", urgent: true, completed: false };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const urgent = hours < 6;
    const text = `${hours}h ${minutes}m ${seconds}s`;
    
    return { expired: false, text, urgent, completed: false };
  };

  const getFaceValueFirstTwo = (faceValue: number) => {
    const faceValueStr = faceValue?.toString() || "0";
    return faceValueStr.length >= 2 ? faceValueStr.substring(0, 2) : faceValueStr.padStart(2, '0');
  };

  return (
       <div className="min-h-screen bg-gradient-to-br  from-pink-50 via-white to-purple-50">
      <div className="container mx-auto mt-10 px-4 py-6">

        {/* Filters Section */}
        <div className="bg-white border border-pink-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-pink-900">Filter</h2>
            <button
              onClick={resetFilters}
              className="text-pink-600 hover:text-pink-900 text-sm font-medium transition-colors"
            >
              Reset All
            </button>
          </div>

          <div className="space-y-4">
            {/* Date Range Filter */}
            <div>
              <h3 className="text-sm font-medium text-pink-700 mb-2">Date Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full border border-pink-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-900 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full border border-pink-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bill-to Parties Filter */}
            <div className="relative">
              <h3 className="text-sm font-medium text-pink-700 mb-2">
                Bill-to Parties ({selectedParties.length}/{getBillToParties().length})
              </h3>
              
              <div className="mb-2">
                {selectedParties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedParties.map(party => (
                      <span
                        key={party}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-900 text-white"
                      >
                        {party}
                        <button
                          onClick={() => handlePartyToggle(party)}
                          className="ml-1.5 text-pink-300 hover:text-white transition-colors"
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
                className="w-full flex items-center justify-between px-3 py-2 border border-pink-300 rounded-md bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-pink-900 focus:border-transparent"
              >
                <span className="text-gray-700">
                  {selectedParties.length === 0 ? 'Select parties...' : 
                   selectedParties.length === getBillToParties().length ? 'All parties selected' :
                   `${selectedParties.length} selected`}
                </span>
                <svg className={`w-4 h-4 text-pink-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-pink-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="px-3 py-2 bg-pink-50 border-b border-pink-200 flex justify-between">
                    <button
                      onClick={selectAllParties}
                      className="text-xs text-pink-700 hover:text-pink-900 font-medium transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={selectNoneParties}
                      className="text-xs text-pink-700 hover:text-pink-900 font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {getBillToParties().map(party => (
                    <label
                      key={party}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParties.includes(party)}
                        onChange={() => handlePartyToggle(party)}
                        className="w-4 h-4 text-gray-900 border-pink-300 rounded focus:ring-gray-900"
                      />
                      <span className="ml-2 text-sm text-gray-700">{party}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-pink-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-pink-700">
                Showing {filteredAssets.length} of {postedAndCancelledCount} {activeTab === 'liqwik' ? 'Liqwik invoices' : 'tokens'}
              </span>
            </div>
          </div>
        </div>
         
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('liqwik')}
            className={`px-6 py-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'liqwik'
                ? 'text-pink-900 border-b-2 border-pink-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Liqwik
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'wallet'
                ? 'text-pink-900 border-b-2 border-pink-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Wallet
          </button>
        </div>
        {/* Content Area */}
        {activeTab === 'liqwik' ? (
          /* Liqwik List View */
          <div className="space-y-4">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => {
                const bidStatus = getBidStatus(asset);
                const faceValueFirstTwo = getFaceValueFirstTwo(asset.faceValueInCents ? asset.faceValueInCents / 100 : 0);
                const countdown = bidStatus.hasAcceptedBid ? getPaymentCountdown(bidStatus.paymentDeadline, bidStatus.paymentApproved) : null;
                const isCancelled = asset.isCancelled === true;
                
                return (
                  <Link
                    key={asset.id}
                    href={isCancelled ? "#" : `/assets/${asset.id}`}
                    className={`block ${isCancelled ? 'cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      if (isCancelled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className={`bg-white rounded-xl shadow-md border overflow-hidden transition-all duration-300 ${
                      isCancelled 
                        ? 'border-gray-300 opacity-60' 
                        : 'border-gray-100 hover:shadow-xl hover:border-gray-300 transform hover:-translate-y-1'
                    }`}>
                      <div className="flex items-center p-5">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={isCancelled ? "/Transparent-Silver-image.png" : "/Transparent-Gold-image.png"}
                            alt="Liqwik Token"
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
                                  color: isCancelled ? '#C0C0C0' : '#D4AF37'
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
                                  color: isCancelled ? '#C0C0C0' : '#D4AF37'
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
                                  color: isCancelled ? '#C0C0C0' : '#D4AF37'
                                }}
                              >
                                {asset.apy ? asset.apy.toFixed(0) : '0'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-5 flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`font-bold text-lg truncate ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>
                              {asset.billToParty.name}
                            </div>
                            <span className="text-gray-400">•</span>
                            <div className={`text-sm font-medium ${isCancelled ? 'text-gray-400' : 'text-gray-600'}`}>
                              #{asset.invoiceNumber}
                            </div>
                            {isCancelled && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Cancelled
                                </span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={`font-semibold ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>
                                €{((asset.faceValueInCents || 0) / 100).toLocaleString()}
                              </span>
                            </div>
                            
                            <span className="text-gray-300">|</span>
                            
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={isCancelled ? 'text-gray-500' : 'text-gray-700'}>
                                {Math.abs(asset.numDaysForPayment || 0)} days
                              </span>
                            </div>

                            {!isCancelled && (
                              <>
                                <span className="text-gray-300">|</span>
                                
                                {bidStatus.total === 0 ? (
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <span>No bids</span>
                                  </div>
                                ) : bidStatus.hasAcceptedBid ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Bid Accepted</span>
                                    </div>
                                    {countdown && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <div className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${
                                          countdown.completed
                                            ? 'text-green-600 bg-green-50 px-2 py-1 rounded-full'
                                            : countdown.expired 
                                              ? 'text-red-600 bg-red-50 px-2 py-1 rounded-full' 
                                              : countdown.urgent 
                                                ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse' 
                                                : 'text-blue-600'
                                        }`}>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>{countdown.text}</span>
                                        </div>
                                        {bidStatus.paymentApprovedAt && (
                                          <>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs text-gray-500">
                                              Received {new Date(bidStatus.paymentApprovedAt).toLocaleDateString()}
                                            </span>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ) : bidStatus.pending > 0 ? (
                                  <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{bidStatus.pending} pending</span>
                                    <span className="text-gray-400">({bidStatus.total} total)</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <span>{bidStatus.total} bids</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        {!isCancelled && (
                          <div className="text-gray-500 flex-shrink-0 ml-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-100">
                <div className="text-center py-16">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No Liqwik invoices found</h3>
                  <p className="mt-2 text-sm text-gray-500">Posted invoices will appear here in your Liqwik portfolio.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Wallet View */
          <div>
            {approvedAssets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tokens Yet</h3>
                <p className="text-gray-500">Create your first token to see it here</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Active Tokens Card */}
                  <div className="bg-white shadow-lg rounded-2xl p-6 border-2 border-green-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <h2 className="text-lg font-bold text-gray-800">Fees Paid Tokens</h2>
                      </div>
                      <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {greenTokens.length} Token{greenTokens.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">
                        €{totalGreenFees.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Total paid fees</p>
                    </div>
                  </div>

                  {/* Posted Tokens Card */}
                  <div className="bg-white shadow-lg rounded-2xl p-6 border-2 border-gray-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-bold text-gray-800">Posted Tokens</h2>
                      </div>
                      <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {greyTokens.length} Token{greyTokens.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-600">
                        €{totalGreyFees.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Total posted fees</p>
                    </div>
                  </div>

                  {/* Cancelled Tokens Card */}
                  <div className="bg-white shadow-lg rounded-2xl p-6 border-2 border-black">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-black" />
                        <h2 className="text-lg font-bold text-gray-800">Cancelled Tokens</h2>
                      </div>
                      <span className="bg-gray-800 text-white text-sm font-semibold px-3 py-1 rounded-full">
                        {blackTokens.length} Token{blackTokens.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-black">
                        €{totalBlackFees.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Total cancelled fees</p>
                    </div>
                  </div>
                </div>

                {/* Active Green Tokens Section */}
                {greenTokens.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-green-500 rounded"></div>
                      Active Tokens
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      {greenTokens.map((asset) => {
                        const faceValue = (asset.faceValueInCents || 0) / 100;
                        const assetFee = faceValue * 0.01;
                        const faceValueFirstTwo = getFirstTwoDigits(faceValue);

                        return (
                          <div 
                            key={asset.id} 
                            className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-400 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:scale-105 flex flex-col items-center group"
                          >
                            <div className="relative w-32 h-32 mb-3">
                              <Image
                                src="/Transparent-Green-image.png"
                                alt="Active Token"
                                width={128}
                                height={128}
                                className="object-contain"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <div 
                                    className="absolute font-bold text-sm"
                                    style={{ 
                                      top: '18%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      color: '#228B22'
                                    }}
                                  >
                                    {asset.termMonths || 0}
                                  </div>
                                  
                                  <div 
                                    className="absolute font-bold text-xl"
                                    style={{ 
                                      top: '48%',
                                      left: '58%',
                                      transform: 'translateY(-50%)',
                                      color: '#228B22'
                                    }}
                                  >
                                    {faceValueFirstTwo}
                                  </div>
                                  
                                  <div 
                                    className="absolute font-bold text-sm"
                                    style={{ 
                                      bottom: '18%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      color: '#228B22'
                                    }}
                                  >
                                    {asset.apy ? asset.apy.toFixed(0) : '0'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mb-2">
                              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                                Active
                              </span>
                            </div>

                            <div className="text-center w-full">
                              <div className="text-xs text-gray-600 mb-1">Fee Amount</div>
                              <div className="text-lg font-bold text-green-600">
                                €{assetFee.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Posted Grey Tokens Section */}
                {greyTokens.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gray-400 rounded"></div>
                      Posted Tokens
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      {greyTokens.map((asset) => {
                        const faceValue = (asset.faceValueInCents || 0) / 100;
                        const assetFee = faceValue * 0.01;
                        const faceValueFirstTwo = getFirstTwoDigits(faceValue);

                        return (
                          <div 
                            key={asset.id} 
                            className="bg-gray-50 rounded-2xl p-4 shadow-md border-2 border-gray-300 opacity-75 flex flex-col items-center cursor-not-allowed"
                          >
                            <div className="relative w-32 h-32 mb-3">
                              <Image
                                src="/Transparent-Grey-image.png"
                                alt="Posted Token"
                                width={128}
                                height={128}
                                className="object-contain grayscale"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <div 
                                    className="absolute font-bold text-sm"
                                    style={{ 
                                      top: '18%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      color: '#6B7280'
                                    }}
                                  >
                                    {asset.termMonths || 0}
                                  </div>
                                  
                                  <div 
                                    className="absolute font-bold text-xl"
                                    style={{ 
                                      top: '48%',
                                      left: '58%',
                                      transform: 'translateY(-50%)',
                                      color: '#6B7280'
                                    }}
                                  >
                                    {faceValueFirstTwo}
                                  </div>
                                  
                                  <div 
                                    className="absolute font-bold text-sm"
                                    style={{ 
                                      bottom: '18%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      color: '#6B7280'
                                    }}
                                  >
                                    {asset.apy ? asset.apy.toFixed(0) : '0'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mb-2">
                              <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                                Posted
                              </span>
                            </div>

                            <div className="text-center w-full">
                              <div className="text-xs text-gray-500 mb-1">Fee Paid</div>
                              <div className="text-lg font-bold text-gray-600">
                                €{assetFee.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancelled Black Tokens Section */}
                {blackTokens.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-black rounded"></div>
                      Cancelled Tokens (Refund)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      {blackTokens.map((asset) => {
                        const faceValue = (asset.faceValueInCents || 0) / 100;
                        const assetFee = faceValue * 0.01;
                        const faceValueFirstTwo = getFirstTwoDigits(faceValue);

                        return (
                          <div 
                            key={asset.id} 
                            className="bg-white rounded-2xl p-4 shadow-lg border-2 border-black hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105 flex flex-col items-center group cursor-pointer"
                          >
                            <div className="relative w-32 h-32 mb-3">
                              <Image
                                src="/Transparent-Black-image.png"
                                alt="Cancelled Token"
                                width={128}
                                height={128}
                                className="object-contain"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <div 
                                    className="absolute font-bold text-sm"
                                    style={{ 
                                      top: '18%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      color: '#000000'
                                    }}
                                  >
                                    {asset.termMonths || 0}
                                  </div>
                                  
                                  <div 
                                    className="absolute font-bold text-xl"
                                    style={{ 
                                      top: '48%',
                                      left: '58%',
                                      transform: 'translateY(-50%)',
                                      color: '#000000'
                                    }}
                                  >
                                    {faceValueFirstTwo}
                                  </div>
                                  
                                  <div 
                                    className="absolute font-bold text-sm"
                                    style={{ 
                                      bottom: '18%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      color: '#000000'
                                    }}
                                  >
                                    {asset.apy ? asset.apy.toFixed(0) : '0'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mb-2">
                              <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                Cancelled
                              </span>
                            </div>

                            <div className="text-center w-full">
                              <div className="text-xs text-gray-600 mb-1">Fee Paid</div>
                              <div className="text-lg font-bold text-black">
                                €{assetFee.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className="mt-12"></div>
      </div>
    </div>
  );
}