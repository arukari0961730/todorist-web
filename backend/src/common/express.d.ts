declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    currentUser?: {
      id: string;
      name: string;
      email: string;
    };
    sessionToken?: string;
  }
}

export {};
