import type { JwtPayload } from "jsonwebtoken";

export type role = "ORGANIZER" | "STAFF" | "AUDIENCE";

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: role;
}
