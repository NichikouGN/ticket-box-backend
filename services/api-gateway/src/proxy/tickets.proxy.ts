import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

export const ticketProxy = createProxyMiddleware({
  target: SERVICES.TICKET,
  changeOrigin: true,
  pathRewrite: {
    "^/": "/tickets/",
  },
});

export const checkinProxy = createProxyMiddleware({
  target: SERVICES.TICKET,
  changeOrigin: true,
  pathRewrite: {
    "^/": "/checkin/",
  },
});
