import "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        username: string;
        role?: string;
        email?: string;
        name?: string;
      } | null;

      tenantId: string;
    }
  }
}

export {}; // This is important for TypeScript module recognition
