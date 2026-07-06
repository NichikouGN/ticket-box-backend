import express from "express";
import morgan from "morgan";
import routes from "./routes/index.route.js";
import cors from "cors";
import { redis, waitForRedisReady } from "./clients/redis.client.js";

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(routes);

await waitForRedisReady(redis);

app.listen(PORT, () => {
  console.log(`API Gateway listening on ${PORT}`);
});
