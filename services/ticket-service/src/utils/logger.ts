import pino from "pino";

const logger = pino({
  name: "ticket-service",
  level: process.env.LOG_LEVEL || "info",

});

export default logger;
