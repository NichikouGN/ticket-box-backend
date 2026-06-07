import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

export const orderProxy = createProxyMiddleware({
  target: SERVICES.ORDER,
  changeOrigin: true,
});
