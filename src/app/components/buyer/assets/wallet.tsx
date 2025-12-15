import React, { useMemo } from 'react';
import Image from "next/image";
import { Coins, CheckCircle2, Clock } from 'lucide-react';

type Props = {
  bids?: any[];
};

const BuyerWallet = ({ bids = [] }: Props) => {
  // Filter bids where payment is pending (green tokens)
  // Green: accepted bid, payment not confirmed, deadline not passed
  const pendingPaymentBids = useMemo(() => {
    const currentDate = new Date();
    return bids.filter(bid => 
      bid.accepted === true &&
      bid.paymentApprovedByBuyer === false &&
      bid.paymentDeadline &&
      new Date(bid.paymentDeadline) > currentDate
    );
  }, [bids]);

  // Grey tokens: payment confirmed by buyer
  const paidBids = useMemo(() => {
    return bids.filter(bid => bid.paymentApprovedByBuyer === true);
  }, [bids]);

  // Calculate total payment amounts
  const totalPendingAmount = useMemo(() => {
    return pendingPaymentBids.reduce(
      (sum, bid) => sum + ((bid.numUnits * bid.centsPerUnit) / 100),
      0
    );
  }, [pendingPaymentBids]);

  const totalPaidAmount = useMemo(() => {
    return paidBids.reduce(
      (sum, bid) => sum + ((bid.numUnits * bid.centsPerUnit) / 100),
      0
    );
  }, [paidBids]);

  // Helper function to get first two digits
  const getFirstTwoDigits = (value: number) => {
    const valueStr = value.toString().replace(/\D/g, '');
    return valueStr.length >= 2 ? valueStr.substring(0, 2) : valueStr.padStart(2, '0');
  };

  if (!bids || bids.length === 0) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center mt-10">
            <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tokens Yet</h3>
            <p className="text-gray-500">Your accepted bids will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Coins className="w-8 h-8 text-pink-700" />
            My Wallet
          </h1>
          <p className="text-gray-600">Manage your payment tokens</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pending Payment Tokens Card */}
          <div className="bg-white shadow-lg rounded-2xl p-6 border-2 border-green-400">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-800">Pending Payments</h2>
              </div>
              <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                {pendingPaymentBids.length} Token{pendingPaymentBids.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                €{totalPendingAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">Total pending payments</p>
            </div>
          </div>

          {/* Paid Tokens Card */}
          <div className="bg-white shadow-lg rounded-2xl p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-800">Completed Payments</h2>
              </div>
              <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
                {paidBids.length} Token{paidBids.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600">
                €{totalPaidAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">Total completed payments</p>
            </div>
          </div>
        </div>

        {/* Pending Payment Green Tokens Section */}
        {pendingPaymentBids.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-500 rounded"></div>
              Pending Payments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {pendingPaymentBids.map((bid) => {
                const bidAmount = (bid.numUnits * bid.centsPerUnit) / 100;
                const faceValue = (bid.asset.faceValueInCents || 0) / 100;
                const faceValueFirstTwo = getFirstTwoDigits(faceValue);

                return (
                  <div 
                    key={bid.id} 
                    className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-400 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:scale-105 flex flex-col items-center group"
                  >
                    {/* Green Token Image with Values */}
                    <div className="relative w-32 h-32 mb-3">
                      <Image
                        src="/Transparent-Green-image.png"
                        alt="Pending Payment Token"
                        width={128}
                        height={128}
                        className="object-contain"
                      />
                      {/* Overlay values on the token image */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Duration (top center) */}
                          <div 
                            className="absolute font-bold text-sm"
                            style={{ 
                              top: '18%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              color: '#228B22'
                            }}
                          >
                            {bid.asset.termMonths || 0}
                          </div>
                          
                          {/* Face Value (center right - first two digits) */}
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
                          
                          {/* APY (bottom center) */}
                          <div 
                            className="absolute font-bold text-sm"
                            style={{ 
                              bottom: '18%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              color: '#228B22'
                            }}
                          >
                            {bid.asset.apy ? bid.asset.apy.toFixed(0) : '0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>

                    {/* Payment Amount */}
                    <div className="text-center w-full">
                      <div className="text-xs text-gray-600 mb-1">Payment Due</div>
                      <div className="text-lg font-bold text-green-600">
                        €{bidAmount.toLocaleString('en-US', {
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

        {/* Paid Grey Tokens Section */}
        {paidBids.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gray-400 rounded"></div>
              Completed Payments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {paidBids.map((bid) => {
                const bidAmount = (bid.numUnits * bid.centsPerUnit) / 100;
                const faceValue = (bid.asset.faceValueInCents || 0) / 100;
                const faceValueFirstTwo = getFirstTwoDigits(faceValue);

                return (
                  <div 
                    key={bid.id} 
                    className="bg-gray-50 rounded-2xl p-4 shadow-md border-2 border-gray-300 opacity-75 flex flex-col items-center cursor-not-allowed"
                  >
                    {/* Grey Token Image with Values */}
                    <div className="relative w-32 h-32 mb-3">
                      <Image
                        src="/Transparent-Grey-image.png"
                        alt="Completed Payment Token"
                        width={128}
                        height={128}
                        className="object-contain grayscale"
                      />
                      {/* Overlay values on the token image */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Duration (top center) */}
                          <div 
                            className="absolute font-bold text-sm"
                            style={{ 
                              top: '18%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              color: '#6B7280'
                            }}
                          >
                            {bid.asset.termMonths || 0}
                          </div>
                          
                          {/* Face Value (center right - first two digits) */}
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
                          
                          {/* APY (bottom center) */}
                          <div 
                            className="absolute font-bold text-sm"
                            style={{ 
                              bottom: '18%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              color: '#6B7280'
                            }}
                          >
                            {bid.asset.apy ? bid.asset.apy.toFixed(0) : '0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                        Paid
                      </span>
                    </div>

                    {/* Payment Amount */}
                    <div className="text-center w-full">
                      <div className="text-xs text-gray-500 mb-1">Payment Made</div>
                      <div className="text-lg font-bold text-gray-600">
                        €{bidAmount.toLocaleString('en-US', {
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
      </div>
      <div className='mt-10'></div>
    </div>
  );
};

export default BuyerWallet;