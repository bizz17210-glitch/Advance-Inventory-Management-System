// utils/breadcrumbMap.ts
export const breadcrumbMap: Record<string, { title: string; crumb: string }> = {
  "/": { title: "Dashboard", crumb: "Overview" },
  "/orders": { title: "Orders", crumb: "All Orders" },
  "/products": { title: "Products", crumb: "All Products" },
  "/inventory": { title: "Inventory", crumb: "Stock Levels" },
  "/customers": { title: "Customers", crumb: "All Customers" },
  // ... add more routes
};
