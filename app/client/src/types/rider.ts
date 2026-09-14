export type RiderStatusType = "Active" | "Offline" | "On Delivery";

export interface Rider {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: RiderStatusType;
  deliveriesToday: number;
  totalDeliveries: number;
  earnings: number;
  joinedAt: string;
}
