import { Router } from 'express';
import type { Server as SocketIoServer } from 'socket.io';
import { registerReceptionRoutes } from './index.js';

export function createReceptionRouter(io: SocketIoServer) {
  const router = Router();
  registerReceptionRoutes(router, io);
  return router;
}
