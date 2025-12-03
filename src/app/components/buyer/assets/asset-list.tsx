// src/app/components/buyer/assets/asset-list.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Calendar, TrendingUp, FileText, Gavel, Target, DollarSign, Filter, Users, RotateCcw, ChevronDown, X, Check, Clock, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

import { useSession } from "next-auth/react";
import PaymentPopup from "./payment-popup";

type Props = {
  assets?: any[];
};

export default function AssetList({ assets = [] }: Props) {
  const session = useSession();
  const [user, setUser] = useState<any>();
  
  // Payment popup state
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);

  // Main filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Time series specific filters
  const [timeGroupBy, setTimeGroupBy] = useState("month");

  // Dropdown ref for outside click detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user from session
  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Updated APY Calculation Function
  const getAPY = (asset: any, bid: any) => {
    if (!bid?.totalAmount || !asset?.faceValue) return 0;
    const margin = asset.faceValue - bid.totalAmount;
    const annualizedMargin = (margin * 12) / asset.termMonths;
    const apy = Math.ceil((annualizedMargin / bid.totalAmount) * 100);
    return apy;
  };

  // Get all unique bill-to parties
  const allParties = useMemo(() => {
    const parties = Array.from(new Set(assets.map(asset => asset.billToParty?.name || "Unknown")));
    return parties.sort();
  }, [assets]);

  // Filter assets by date range and selected parties
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Date filter
      const invoiceDate = new Date(asset.invoiceDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && invoiceDate < start) return false;
      if (end && invoiceDate > end) return false;

      // Party filter
      if (selectedParties.length > 0) {
        const partyName = asset.billToParty?.name || "Unknown";
        if (!selectedParties.includes(partyName)) return false;
      }

      return true;
    });
  }, [assets, startDate, endDate, selectedParties]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    
    // Total invoices (excluding cancelled)
    const totalInvoices = filteredAssets.filter(a => !a.isCancelled).length;
    
    // Total face value (excluding cancelled)
    const totalFaceValue = filteredAssets
      .filter(a => !a.isCancelled)
      .reduce((sum, a) => sum + a.faceValueInCents, 0);
    
    // Total bids (all bids)
    const totalBids = filteredAssets.reduce((sum, a) => sum + a.bids.length, 0);
    
    // Accepted bids
    const acceptedBids = filteredAssets.reduce((sum, a) => {
      return sum + a.bids.filter((b: any) => b.accepted).length;
    }, 0);

    // Bids waiting for payment (within 24hrs of payment deadline)
    const bidsWaitingForPayment = filteredAssets.reduce((sum, a) => {
      return sum + a.bids.filter((b: any) => {
        if (!b.accepted || !b.paymentDeadline || b.paymentApprovedByBuyer) return false;
        const deadline = new Date(b.paymentDeadline);
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDeadline > 0 && hoursUntilDeadline <= 24;
      }).length;
    }, 0);

    // Settlement contracts (payment approved by buyer)
    const settlementContracts = filteredAssets.reduce((sum, a) => {
      return sum + a.bids.filter((b: any) => b.accepted && b.paymentApprovedByBuyer).length;
    }, 0);

    // Payment overdue (deadline passed, payment not approved)
    const paymentOverdue = filteredAssets.reduce((sum, a) => {
      return sum + a.bids.filter((b: any) => {
        if (!b.accepted || !b.paymentDeadline || b.paymentApprovedByBuyer) return false;
        const deadline = new Date(b.paymentDeadline);
        return now > deadline;
      }).length;
    }, 0);

    let totalDiscountedValue = 0;
    let totalAPY = 0;
    let apyCount = 0;

    filteredAssets.forEach(asset => {
      const acceptedBid = asset.bids.find((b: any) => b.accepted);
      if (acceptedBid) {
        const discountedValue = acceptedBid.centsPerUnit * acceptedBid.numUnits;
        totalDiscountedValue += discountedValue;
        
        // Use the correct APY calculation
        const assetForAPY = {
          faceValue: asset.faceValueInCents / 100,
          termMonths: asset.termMonths
        };
        const bidForAPY = {
          totalAmount: discountedValue / 100
        };
        
        const apy = getAPY(assetForAPY, bidForAPY);
        if (apy > 0) {
          totalAPY += apy;
          apyCount++;
        }
      }
    });

    const avgAPY = apyCount > 0 ? totalAPY / apyCount : 0;

    return {
      totalInvoices,
      totalFaceValue,
      totalBids,
      acceptedBids,
      bidsWaitingForPayment,
      settlementContracts,
      paymentOverdue,
      totalDiscountedValue,
      avgAPY
    };
  }, [filteredAssets]);

  // Chart data for bill-to party analysis
  const partyAnalysis = useMemo(() => {
    const partyData: any = {};
    
    filteredAssets
      .filter(a => !a.isCancelled)
      .forEach(asset => {
        const party = asset.billToParty?.name || "Unknown";
        if (!partyData[party]) {
          partyData[party] = {
            party,
            faceValue: 0,
            discountedValue: 0,
            apy: 0,
            count: 0,
            apySum: 0
          };
        }

        partyData[party].faceValue += asset.faceValueInCents / 100;
        partyData[party].count++;

        const acceptedBid = asset.bids.find((b: any) => b.accepted);
        if (acceptedBid) {
          const discountedValue = (acceptedBid.centsPerUnit * acceptedBid.numUnits) / 100;
          partyData[party].discountedValue += discountedValue;
          
          const assetForAPY = {
            faceValue: asset.faceValueInCents / 100,
            termMonths: asset.termMonths
          };
          const bidForAPY = {
            totalAmount: discountedValue
          };
          
          const apy = getAPY(assetForAPY, bidForAPY);
          partyData[party].apySum += apy;
          partyData[party].apy = partyData[party].apySum / partyData[party].count;
        }
      });

    return Object.values(partyData);
  }, [filteredAssets]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    const groupedData: any = {};
    
    filteredAssets
      .filter(a => !a.isCancelled)
      .forEach(asset => {
        const date = new Date(asset.invoiceDate);
        let key = "";
        
        switch (timeGroupBy) {
          case "year":
            key = date.getFullYear().toString();
            break;
          case "quarter":
            key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
            break;
          case "month":
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case "week":
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            key = `${date.getFullYear()}-W${weekNumber}`;
            break;
          case "day":
            key = date.toISOString().split('T')[0];
            break;
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            period: key,
            faceValue: 0,
            discountedValue: 0,
            apy: 0,
            count: 0,
            apySum: 0
          };
        }

        groupedData[key].faceValue += asset.faceValueInCents / 100;
        groupedData[key].count++;

        const acceptedBid = asset.bids.find((b: any) => b.accepted);
        if (acceptedBid) {
          const discountedValue = (acceptedBid.centsPerUnit * acceptedBid.numUnits) / 100;
          groupedData[key].discountedValue += discountedValue;
          
          const assetForAPY = {
            faceValue: asset.faceValueInCents / 100,
            termMonths: asset.termMonths
          };
          const bidForAPY = {
            totalAmount: discountedValue
          };
          
          const apy = getAPY(assetForAPY, bidForAPY);
          groupedData[key].apySum += apy;
          groupedData[key].apy = groupedData[key].apySum / groupedData[key].count;
        }
      });

    return Object.values(groupedData).sort((a: any, b: any) => a.period.localeCompare(b.period));
  }, [filteredAssets, timeGroupBy]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedParties([]);
    setTimeGroupBy('month');
    setIsDropdownOpen(false);
  };

  const toggleParty = (party: string) => {
    setSelectedParties(prev => 
      prev.includes(party) 
        ? prev.filter(p => p !== party)
        : [...prev, party]
    );
  };

  const selectAllParties = () => {
    setSelectedParties(allParties);
  };

  const clearAllParties = () => {
    setSelectedParties([]);
  };

  const removeSelectedParty = (party: string) => {
    setSelectedParties(prev => prev.filter(p => p !== party));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-pink-200 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: €{entry.value?.toLocaleString() || 0}
              {entry.name === 'APY' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="px-4 py-6 pb-24">
        {/* Main Filters */}
        <div className="bg-white rounded-xl p-4 mt-9 mb-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Global Filters
            </h3>
            <button 
              onClick={resetFilters}
              className="flex items-center text-sm text-stone-600 hover:text-stone-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset All
            </button>
          </div>
          
          {/* Date Range */}
          <div className="mb-4">
            <label className="text-sm font-medium text-stone-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={startDate}
                  placeholder="Start Date"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-stone-300 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={endDate}
                  placeholder="End Date"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-stone-300 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bill-to Party Multi-Select Dropdown */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Bill-to Parties ({selectedParties.length}/{allParties.length})
            </label>
            
            {/* Selected parties tags */}
            {selectedParties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedParties.map(party => (
                  <span
                    key={party}
                    className="inline-flex items-center bg-stone-100 text-stone-800 text-xs px-2 py-1 rounded-full"
                  >
                    {party}
                    <button
                      onClick={() => removeSelectedParty(party)}
                      className="ml-1 text-stone-600 hover:text-stone-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-pink-50 focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <span className="text-stone-700">
                  {selectedParties.length === 0 
                    ? 'Select parties...' 
                    : selectedParties.length === allParties.length 
                      ? 'All parties selected'
                      : `${selectedParties.length} selected`
                  }
                </span>
                <ChevronDown className={`w-4 h-4 text-stone-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  {/* Header with actions */}
                  <div className="px-3 py-2 border-b border-stone-100 bg-stone-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-stone-700 font-medium">Select Parties</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={selectAllParties}
                          className="text-xs text-stone-600 hover:text-stone-800"
                        >
                          All
                        </button>
                        <button
                          onClick={clearAllParties}
                          className="text-xs text-stone-600 hover:text-stone-800"
                        >
                          None
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Options list */}
                  <div className="max-h-48 overflow-y-auto">
                    {allParties.map(party => (
                      <div
                        key={party}
                        className="flex items-center px-3 py-2 hover:bg-stone-50 cursor-pointer"
                        onClick={() => toggleParty(party)}
                      >
                        <div className="flex items-center justify-center w-4 h-4 mr-3">
                          {selectedParties.includes(party) && (
                            <Check className="w-3 h-3 text-stone-600" />
                          )}
                        </div>
                        <span className="text-sm text-stone-700 flex-1">{party}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600">
            Showing {filteredAssets.filter(a => !a.isCancelled).length} of {assets.filter(a => !a.isCancelled).length} invoices
            {selectedParties.length > 0 && (
              <span> • {selectedParties.length} parties selected</span>
            )}
            {(startDate || endDate) && (
              <span> • Custom date range</span>
            )}
          </div>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <MetricCard
            title="Total Invoices"
            value={metrics.totalInvoices}
            icon={<FileText className="w-6 h-6" />}
            color="bg-pink-700"
          />
          <MetricCard
            title="Total Face Value"
            value={`€${(metrics.totalFaceValue / 100).toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-stone-500"
          />
          <MetricCard
            title="Total Bids"
            value={metrics.totalBids}
            icon={<Gavel className="w-6 h-6" />}
            color="bg-pink-700"
          />
        </div>

        {/* KPI Cards - Row 2 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <MetricCard
            title="Accepted Bids"
            value={metrics.acceptedBids}
            icon={<Target className="w-6 h-6" />}
            color="bg-stone-500"
          />
          <MetricCard
            title="Waiting for Payment"
            value={metrics.bidsWaitingForPayment}
            subtitle="(Within 24hrs)"
            icon={<Clock className="w-6 h-6" />}
            color="bg-pink-700"
          />
          <MetricCard
            title="Settlement Contracts"
            value={metrics.settlementContracts}
            subtitle="(Payment Approved)"
            icon={<CheckCircle className="w-6 h-6" />}
            color="bg-stone-500"
          />
        </div>

        {/* KPI Cards - Row 3 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MetricCard
            title="Payment Overdue"
            value={metrics.paymentOverdue}
            icon={<AlertCircle className="w-6 h-6" />}
            color="bg-pink-700"
          />
          <MetricCard
            title="Discounted Value"
            value={`€${(metrics.totalDiscountedValue / 100).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-stone-500"
          />
          <MetricCard
            title="Average APY"
            value={`${metrics.avgAPY.toFixed(2)}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-pink-700"
          />
        </div>

        {/* Bill-to Party Analysis Chart */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-pink-100">
          <h3 className="text-lg font-semibold text-pink-800 mb-4">Analysis by Bill-to Party</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partyAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="party" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="faceValue" fill="#be185d" name="Face Value" />
              <Bar dataKey="discountedValue" fill="#ec4899" name="Discounted Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time Series Chart with Internal Filters */}
        <div className="bg-white rounded-xl p-4 mb-8 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-pink-800">Performance Over Time</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-pink-600">Group by:</span>
              <div className="relative">
                <select
                  value={timeGroupBy}
                  onChange={(e) => setTimeGroupBy(e.target.value)}
                  className="appearance-none bg-pink-50 border border-pink-200 rounded-lg px-3 py-1 text-sm text-pink-800 focus:ring-2 focus:ring-pink-300 focus:border-transparent pr-8"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-600 pointer-events-none" />
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="faceValue" 
                stroke="#be185d" 
                name="Face Value"
                strokeWidth={2}
                dot={{ fill: "#be185d", strokeWidth: 0, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="discountedValue" 
                stroke="#ec4899" 
                name="Discounted Value"
                strokeWidth={2}
                dot={{ fill: "#ec4899", strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pay for Token Button */}
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <button 
            onClick={() => setIsPaymentPopupOpen(true)}
            className="bg-pink-700 hover:bg-pink-800 text-white font-semibold py-4 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          >
            <span className="text-lg">Pay for token</span>
          </button>
        </div>
      </div>

      {/* Payment Popup */}
      {user && (
        <PaymentPopup 
          isOpen={isPaymentPopupOpen}
          onClose={() => setIsPaymentPopupOpen(false)}
          userId={user.id}
          onPaymentComplete={() => {
            // Optionally refresh data or show success message
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  color,
  fullWidth = false
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ReactNode; 
  color: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`${color} rounded-xl p-4 text-white shadow-lg ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="opacity-80">{icon}</div>
      </div>
      <div>
        <p className="text-xs opacity-90 mb-1">
          {title}
          {subtitle && <span className="block text-[10px] mt-0.5">{subtitle}</span>}
        </p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}