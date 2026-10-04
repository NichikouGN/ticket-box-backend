import pino from "pino";

const logger = pino({
  name: "order-service",
  level: process.env.LOG_LEVEL || "info",

});

export default logger;
