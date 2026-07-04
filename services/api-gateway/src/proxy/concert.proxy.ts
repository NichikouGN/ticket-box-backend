import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

export const concertProxy = createProxyMiddleware({
  target: SERVICES.CONCERT,
  changeOrigin: true,
});

export const organizerConcertProxy = createProxyMiddleware({
  target: SERVICES.CONCERT,
  changeOrigin: true,
  pathRewrite: {
    "^/": "organizer/concerts/",
  },
});

export const organizerArtistProxy = createProxyMiddleware({
  target: SERVICES.CONCERT,
  changeOrigin: true,
  pathRewrite: {
    "^/": "organizer/artists/",
  },
});

export const staffVipProxy = createProxyMiddleware({
  target: SERVICES.CONCERT,
  changeOrigin: true,
  pathRewrite: {
    "^/": "staff/concerts/",
  },
});
