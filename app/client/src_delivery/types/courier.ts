export type CourierStatus = "Active" | "Inactive" | "Error";

export interface Courier {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  status: CourierStatus;
  totalShipments: number;
  pendingCOD: number;
  lastSync?: string;
}
