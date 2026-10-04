import pino from "pino";

const logger = pino({
  name: "concert-service",
  level: process.env.LOG_LEVEL || "info",

});

export default logger;
