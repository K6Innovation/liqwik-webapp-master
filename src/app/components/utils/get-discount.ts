export default function getDiscount(asset: any, bid: any) {
  if (!bid?.totalAmount || !asset?.faceValue) return;
  const margin = asset.faceValue - bid.totalAmount;
  const discount = Math.ceil((margin / asset.faceValue) * 100);
  return discount;
}