const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-400";
    case "PENDING_BILL_TO_APPROVAL":
      return "bg-gray-400";
    case "BILL_TO_APPROVED":
      return "bg-green-200";
    case "BIDDING_OPEN":
      return "bg-green-300";
    case "WITHDRAWN":
      return "bg-red-200";
    case "BIDDING_CLOSED":
      return "bg-blue-200";
    case "BIDS_ACCEPTED":
      return "bg-yellow-200";
    case "MATURED":
      return "bg-yellow-300";
    default:
      return "bg-gray-200";
  }
};
export default getStatusColor;