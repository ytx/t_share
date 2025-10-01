import { User } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User & { id: number; isAdmin: boolean };
    file?: Express.Multer.File;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User & { id: number; isAdmin: boolean };
      file?: Express.Multer.File;
    }
  }
}