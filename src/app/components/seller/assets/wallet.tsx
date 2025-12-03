import React, { useMemo } from 'react';
import Image from "next/image";
import { Coins, CheckCircle2, Clock, XCircle } from 'lucide-react';

type Props = {
  assets?: any[];
};

const Wallet = ({ assets = [] }: Props) => {
  // Filter assets where fee is approved (feeApprovedBySeller is true)
  const approvedAssets = useMemo(() => {
    return assets.filter(asset => asset.feeApprovedBySeller === true);
  }, [assets]);

  // Green tokens: feeApprovedBySeller = true, isPosted = false, isCancelled = false
  const greenTokens = useMemo(() => {
    return approvedAssets.filter(asset => 
      !asset.isPosted && !asset.isCancelled
    );
  }, [approvedAssets]);

  // Grey tokens: feeApprovedBySeller = true, isPosted = true
  const greyTokens = useMemo(() => {
    return approvedAssets.filter(asset => asset.isPosted === true);
  }, [approvedAssets]);

  // Black tokens: feeApprovedBySeller = true, isCancelled = true
  const blackTokens = useMemo(() => {
    return approvedAssets.filter(asset => 
      asset.isCancelled === true && !asset.isPosted
    );
  }, [approvedAssets]);

  // Calculate total fees for green tokens
  const totalGreenFees = useMemo(() => {
    return greenTokens.reduce(
      (sum, asset) => sum + ((asset.faceValueInCents || 0) / 100) * 0.01,
      0
    );
  }, [greenTokens]);

  // Calculate total fees for grey tokens
  const totalGreyFees = useMemo(() => {
    return greyTokens.reduce(
      (sum, asset) => sum + ((asset.faceValueInCents || 0) / 100) * 0.01,
      0
    );
  }, [greyTokens]);

  // Calculate total fees for black tokens
  const totalBlackFees = useMemo(() => {
    return blackTokens.reduce(
      (sum, asset) => sum + ((asset.faceValueInCents || 0) / 100) * 0.01,
      0
    );
  }, [blackTokens]);

  // Helper function to get first two digits
  const getFirstTwoDigits = (value: number) => {
    const valueStr = value.toString().replace(/\D/g, '');
    return valueStr.length >= 2 ? valueStr.substring(0, 2) : valueStr.padStart(2, '0');
  };

  if (!assets || assets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500 mt-10">Loading transactions...</div>
        </div>
      </div>
    );
  }

  if (approvedAssets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tokens Yet</h3>
            <p className="text-gray-500">Create your first token to see it here</p>
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
          <p className="text-gray-600">Manage your tokens and track fees</p>
        </div>

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
                    {/* Green Token Image with Values */}
                    <div className="relative w-32 h-32 mb-3">
                      <Image
                        src="/Transparent-Green-image.png"
                        alt="Active Token"
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
                            {asset.termMonths || 0}
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
                            {asset.apy ? asset.apy.toFixed(0) : '0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>

                    {/* Fee Amount */}
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
                    {/* Grey Token Image with Values */}
                    <div className="relative w-32 h-32 mb-3">
                      <Image
                        src="/Transparent-Grey-image.png"
                        alt="Posted Token"
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
                            {asset.termMonths || 0}
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
                            {asset.apy ? asset.apy.toFixed(0) : '0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                        Posted
                      </span>
                    </div>

                    {/* Fee Paid Amount */}
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
                    {/* Black Token Image with Values */}
                    <div className="relative w-32 h-32 mb-3">
                      <Image
                        src="/Transparent-Black-image.png"
                        alt="Cancelled Token"
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
                              color: '#000000'
                            }}
                          >
                            {asset.termMonths || 0}
                          </div>
                          
                          {/* Face Value (center right - first two digits) */}
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
                          
                          {/* APY (bottom center) */}
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

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        Cancelled
                      </span>
                    </div>

                    {/* Fee Amount */}
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
      </div>
      <div className='mt-10'></div>
    </div>
  );
};

export default Wallet;