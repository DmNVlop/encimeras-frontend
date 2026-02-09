import type { User } from "./user.interfase";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
