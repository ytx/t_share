// Extend Express Request interface to include user property

declare namespace Express {
  interface Request {
    user?: {
      id: number;
      email: string;
      username?: string;
      displayName?: string;
      isAdmin: boolean;
    };
  }
}