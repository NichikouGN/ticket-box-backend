import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

export const userProxy = createProxyMiddleware({
  target: SERVICES.USER,
  changeOrigin: true,
});
