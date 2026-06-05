import type { JwtPayload } from "jsonwebtoken";

export type Role = "ORGANIZER" | "STAFF" | "AUDIENCE";

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: Role;
}
