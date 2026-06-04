import express from "express";

const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "user-service",
    status: "running",
  });
});

import { Queue, Worker } from "bullmq";

const queue = new Queue("test-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

await queue.add("test-job", { id: 1, foo: "bar" });

app.listen(PORT, () => {
  console.log(`User Service listening on ${PORT}`);
});
