export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  cost: number;
  price: number;
  supplier: string;
  status: ProductStatus;
  imageUrl?: string;
}
