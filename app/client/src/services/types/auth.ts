// ── Auth Request Types ─────────────────────────────────────

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface LoginPayload {
  identifier: string; // email or username
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ── Auth Response Types ────────────────────────────────────

export type UserRole =
  | "Administrator"
  | "OperationsManager"
  | "InventoryManager"
  | "SalesOperator"
  | "Accounts"
  | "CourierHandler"
  | "Rider";

export type UserStatus = "Active" | "Inactive" | "Suspended";

export interface AuthUser {
  _id: string;
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}

export interface MeResponse {
  success: boolean;
  data: AuthUser;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  instructions: {
    client: string;
  };
}

// ── API Error Type ─────────────────────────────────────────

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}
