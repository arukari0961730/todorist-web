export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}
