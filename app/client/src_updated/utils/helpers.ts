// Maps status strings to badge color classes (matches your HTML's statusBadge() function)
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Pending: "yellow",
    Confirmed: "blue",
    Packed: "blue",
    Shipped: "orange",
    Delivered: "green",
    Cancelled: "red",
    "In Stock": "green",
    "Low Stock": "yellow",
    "Out of Stock": "red",
    High: "red",
    Normal: "blue",
    Low: "yellow",
    Critical: "red",
    "In Progress": "blue",
    Done: "green",
    Active: "green",
    Inactive: "gray",
    Offline: "gray",
    Online: "green",
    VIP: "orange",
    Regular: "blue",
    New: "green",
    Occasional: "gray",
  };
  return map[status] || "gray";
}
