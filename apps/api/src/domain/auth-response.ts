import type { Role } from '@prisma/client';
import { signToken } from '../auth.js';

export function toAuthResponse(user: {
  id: string;
  name: string;
  role: Role;
  email?: string | null;
  mobile?: string | null;
}) {
  return {
    token: signToken(user),
    user
  };
}
