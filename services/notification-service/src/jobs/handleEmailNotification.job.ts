import { buildPurchaseEmail } from "../utils/buildPurchaseEmail.util.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { buildReminderEmail } from "../utils/buildReminderEmail.util.js";
dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  logger.error("GMAIL_USER and GMAIL_APP_PASSWORD must be set in environment variables");
  throw new Error("Missing Gmail credentials");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export const handleEmailNotification = async (job: any, notificationType: "ORDER_CONFIRMATION" | "REMINDER_24H") => {
  try {
    const { userInfo, orderId, concertData, ticketTypes } = job.data as {
      userInfo: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        status: string;
      };
      orderId: string;
      concertData: {
        id: string;
        title: string;
        venue: string;
        event_date: string;
      };
      ticketTypes: {
        ticketTypeId: string;
        name: string;
        price: number;
        quantity: number;
      }[];
    };

    const emailContent =
      notificationType === "ORDER_CONFIRMATION"
        ? buildPurchaseEmail({ orderId, userInfo, concertData, ticketTypes })
        : buildReminderEmail({ orderId, userInfo, concertData, ticketTypes });

    await transporter.sendMail({
      from: "nichikou.guen@gmail.com",
      to: userInfo.email,
      subject: emailContent?.subject || "",
      html: emailContent?.html || "",
    });
  } catch (error) {
    console.error("Error in handleEmailNotification:", error);
    throw error;
  }
};
