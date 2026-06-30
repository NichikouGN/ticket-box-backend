import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const userClient = axios.create({
  baseURL: (process.env.USER_SERVICE_URL || "http://localhost:3001") + "/internal",
});

userClient.interceptors.request.use((config) => {
  console.log(
    "Adding internal API key to request headers for user service communication, ",
    process.env.INTERNAL_API_KEY,
  );
  config.headers["x-internal-api-key"] = process.env.INTERNAL_API_KEY;
  return config;
});
