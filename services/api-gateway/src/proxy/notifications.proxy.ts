import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

export const notificationProxy = createProxyMiddleware({
  target: SERVICES.NOTIFICATION,
  changeOrigin: true,
});
