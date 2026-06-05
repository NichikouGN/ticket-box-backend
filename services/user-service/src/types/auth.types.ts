import type { JwtPayload } from "jsonwebtoken";

export type role = "ORGANIZER" | "STAFF" | "AUDIENCE";
export type status = "ACTIVE" | "INACTIVE" | "BANNED";

export interface User {
  id: string;
  email: string;
  password: string;
  role: role;
}

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: role;
}
