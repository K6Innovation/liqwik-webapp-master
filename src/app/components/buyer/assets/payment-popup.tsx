// src/app/components/buyer/payment-popup.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Clock, Building2 } from "lucide-react";
import Image from "next/image";

type PaymentPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPaymentComplete?: () => void;
};

export default function PaymentPopup({ isOpen, onClose, userId, onPaymentComplete }: PaymentPopupProps) {
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch pending payment assets
  useEffect(() => {
    if (isOpen && userId) {
      fetchPendingAssets();
    }
  }, [isOpen, userId]);

  const fetchPendingAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/buyers/${userId}/assets?filterByBids=true`);
      const allAssets = await response.json();
      
      // Filter assets with accepted bids that need payment approval
      const assetsNeedingPayment = allAssets.filter((asset: any) => {
        const acceptedBid = asset.bids.find((bid: any) => bid.accepted);
        if (!acceptedBid) return false;
        
        // Check if payment is not yet approved
        if (acceptedBid.paymentApprovedByBuyer) return false;
        
        // Check if payment deadline exists and hasn't passed
        if (acceptedBid.paymentDeadline) {
          const deadline = new Date(acceptedBid.paymentDeadline);
          const now = new Date();
          
          // Include if deadline hasn't passed yet
          return now <= deadline;
        }
        
        return true;
      });

      setPendingAssets(assetsNeedingPayment);
    } catch (error) {
      console.error("Failed to fetch pending assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedAsset) return;

    try {
      setConfirming(true);
      const acceptedBid = selectedAsset.bids.find((bid: any) => bid.accepted);
      
      const response = await fetch(
        `/api/buyers/${userId}/assets/${selectedAsset.id}/bids/${acceptedBid.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentApproved: true,
          }),
        }
      );

      if (response.ok) {
        // Remove the asset from pending list
        setPendingAssets(prev => prev.filter(a => a.id !== selectedAsset.id));
        setShowConfirmation(false);
        setSelectedAsset(null);
        
        if (onPaymentComplete) {
          onPaymentComplete();
        }
        
        // Close popup if no more pending payments
        if (pendingAssets.length <= 1) {
          onClose();
        }
      } else {
        alert("Failed to confirm payment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const getPaymentCountdown = (paymentDeadline: string | null) => {
    if (!paymentDeadline) return null;
    
    const deadline = new Date(paymentDeadline);
    const diff = deadline.getTime() - currentTime.getTime();
    
    if (diff <= 0) {
      return { expired: true, text: "Overdue", urgent: true };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const urgent = hours < 6;
    const text = `${hours}h ${minutes}m ${seconds}s`;
    
    return { expired: false, text, urgent };
  };

  const getFaceValueFirstTwo = (faceValue: number) => {
    const faceValueStr = faceValue?.toString() || "0";
    return faceValueStr.length >= 2 ? faceValueStr.substring(0, 2) : faceValueStr.padStart(2, '0');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-700 to-purple-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Pending Payments</h2>
              <p className="text-pink-100 text-sm">
                {pendingAssets.length} {pendingAssets.length === 1 ? 'payment' : 'payments'} awaiting confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-700"></div>
            </div>
          ) : pendingAssets.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">You have no pending payments at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssets.map((asset) => {
                const acceptedBid = asset.bids.find((bid: any) => bid.accepted);
                const bidAmount = acceptedBid ? (acceptedBid.centsPerUnit * acceptedBid.numUnits) / 100 : 0;
                const countdown = getPaymentCountdown(acceptedBid?.paymentDeadline);
                const tokenColor = asset.feeApprovedBySeller ? 'gold' : 'copper';
                const tokenImagePath = asset.feeApprovedBySeller 
                  ? "/Transparent-Gold-image.png" 
                  : "/Transparent-Copper-image.png";
                const faceValueFirstTwo = getFaceValueFirstTwo(asset.faceValueInCents ? asset.faceValueInCents / 100 : 0);

                return (
                  <div
                    key={asset.id}
                    onClick={() => handleAssetClick(asset)}
                    className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-5 border-2 border-pink-200 hover:border-pink-400 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      {/* Token */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={tokenImagePath}
                          alt="Liqwik Token"
                          width={64}
                          height={64}
                          className="object-contain drop-shadow-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div 
                              className="absolute font-bold text-[7px]"
                              style={{ 
                                top: '18%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: tokenColor === 'gold' ? '#D4AF37' : '#B87333'
                              }}
                            >
                              {asset.termMonths || 0}
                            </div>
                            <div 
                              className="absolute font-bold text-[9px]"
                              style={{ 
                                top: '48%',
                                left: '58%',
                                transform: 'translateY(-50%)',
                                color: tokenColor === 'gold' ? '#D4AF37' : '#B87333'
                              }}
                            >
                              {faceValueFirstTwo}
                            </div>
                            <div 
                              className="absolute font-bold text-[7px]"
                              style={{ 
                                bottom: '18%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: tokenColor === 'gold' ? '#D4AF37' : '#B87333'
                              }}
                            >
                              {asset.apy ? asset.apy.toFixed(0) : '0'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-pink-700" />
                          <span className="font-bold text-gray-900">{asset.billToParty.name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">#{asset.invoiceNumber}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-green-700">
                              Payment: €{bidAmount.toLocaleString()}
                            </span>
                          </div>
                          
                          {countdown && (
                            <>
                              <span className="text-gray-300">|</span>
                              <div className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${
                                countdown.expired 
                                  ? 'text-red-600 bg-red-50 px-2 py-1 rounded-full' 
                                  : countdown.urgent 
                                    ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse' 
                                    : 'text-blue-600'
                              }`}>
                                <Clock className="w-4 h-4" />
                                <span>{countdown.text} remaining</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="text-pink-500 flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && selectedAsset && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-orange-500" />
                <h3 className="text-xl font-bold text-gray-900">Confirm Bank Transfer</h3>
              </div>
              
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Invoice:</strong> #{selectedAsset.invoiceNumber}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Seller:</strong> {selectedAsset.billToParty.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Amount:</strong> €{((selectedAsset.bids.find((b: any) => b.accepted)?.centsPerUnit || 0) / 100).toFixed(2)}
                </p>
              </div>

              <p className="text-gray-700 mb-6">
                Have you completed the bank transfer for this invoice?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedAsset(null);
                  }}
                  disabled={confirming}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Pay, Later
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {confirming ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Yes, Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}