import pino from "pino";

const logger = pino({
  name: "notification-service",
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:mm:ss",
      ignore: "pid,hostname",
    },
  },
});

export default logger;
