export type Role = 'admin' | 'user';

export type AppItem = {
  id: string;
  name: string;
  login_url: string;
  description?: string | null;
  category?: string | null;
  icon_url?: string | null; // public Blob URL
};

export type SessionToken = {
  uid: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
};
