import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const concertClient = axios.create({
  baseURL: (process.env.CONCERT_SERVICE_URL || "http://localhost:3002") + "/internal",
});

concertClient.interceptors.request.use((config) => {
  config.headers["x-internal-api-key"] = process.env.INTERNAL_API_KEY;
  return config;
});
