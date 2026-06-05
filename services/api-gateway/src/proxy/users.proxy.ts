import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

export const userProxy = createProxyMiddleware({
  target: SERVICES.USER,
  changeOrigin: true,
});

export const authProxy = createProxyMiddleware({
  target: SERVICES.USER,
  changeOrigin: true,
  pathRewrite: {
    "^/": "/auth/",
  },
});

export const organizerProxy = createProxyMiddleware({
  target: SERVICES.USER,
  changeOrigin: true,
  pathRewrite: {
    "^/": "/organizer/",
  },
});
