import express from "express";

const app = express();
const PORT = 3002;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
  });
});

import { Worker } from "bullmq";

const worker = new Worker(
  "test-queue",
  async (job) => {
    console.log("Processing job:", job.id, job.data);
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  },
);

app.listen(PORT, () => {
  console.log(`User Service listening on ${PORT}`);
});
