export default function getAPY(asset: any, bid: any) {
  if (!bid?.totalAmount || !asset?.faceValue) return;
  const margin = asset.faceValue - bid.totalAmount;
  const annualizedMargin = (margin * 12) / asset.termMonths;
  const apy = Math.ceil((annualizedMargin / bid.totalAmount) * 100);
  return apy;
} 