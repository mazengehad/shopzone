export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type RegisterUser = Omit<User, 'id'>;
