import dotenv from "dotenv";
dotenv.config();

export const SERVICES = {
  USER: process.env.USER_SERVICE_URL || "http://localhost:3001",
  CONCERT: process.env.CONCERT_SERVICE_URL || "http://localhost:3002",
  ORDER: process.env.ORDER_SERVICE_URL || "http://localhost:3003",
  PAYMENT: process.env.PAYMENT_SERVICE_URL || "http://localhost:3004",
  TICKET: process.env.TICKET_SERVICE_URL || "http://localhost:3005",
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006",
};
