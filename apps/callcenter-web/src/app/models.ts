export interface CallCenterUser {
  id: string;
  name: string;
  email?: string | null;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: CallCenterUser;
}
