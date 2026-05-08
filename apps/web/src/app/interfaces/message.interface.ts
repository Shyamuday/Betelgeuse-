import type { User } from './user.interface';

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: User;
};
