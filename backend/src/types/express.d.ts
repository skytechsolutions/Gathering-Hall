import { AuthPayload } from "./user.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
