export interface LoginSettings {
  title: string;
  description: string;
  imageUrl?: string;
  logoUrl?: string;
}

export interface AppSettings {
  login: LoginSettings;
}
