import pino from "pino";

const logger = pino({
  name: "user-service",
  level: process.env.LOG_LEVEL || "info",

});

export default logger;
