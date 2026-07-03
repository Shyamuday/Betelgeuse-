import type { User } from './user.interface';

export type Doctor = User & {
  isActive: boolean;
  doctorProfile?: {
    specialty: string;
    registrationNo?: string | null;
    isAvailable: boolean;
  };
};
