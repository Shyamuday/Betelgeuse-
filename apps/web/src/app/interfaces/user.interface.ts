export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  role: Role;
};
