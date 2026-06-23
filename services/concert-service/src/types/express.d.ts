import type { AuthPayload } from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      user?: AuthPayload;
    }
  }
}

export {};
