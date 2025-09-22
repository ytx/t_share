import { User } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User & { id: number; isAdmin: boolean };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User & { id: number; isAdmin: boolean };
    }
  }
}