import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const orderClient = axios.create({
  baseURL: (process.env.ORDER_SERVICE_URL || "http://localhost:3004") + "/internal",
});

orderClient.interceptors.request.use((config) => {
  console.log(
    "Adding internal API key to request headers for order service communication, ",
    process.env.INTERNAL_API_KEY,
  );
  config.headers["x-internal-api-key"] = process.env.INTERNAL_API_KEY;
  return config;
});
