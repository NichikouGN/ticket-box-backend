import express from "express";
import crypto from "crypto";
import { createPaymentWorker } from "./workers/ticket.worker.js";
import ticketRoutes from "./routes/ticket.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";

const app = express();
const PORT = 3006;

app.use(express.json());
app.get("/", (req, res) => {
  console.log("original url: ", req.originalUrl);
});

app.use("/tickets", ticketRoutes);
app.use("/checkin", checkinRoutes);

app.listen(PORT, async () => {
  await createPaymentWorker();
  console.log(`Ticket Service listening on ${PORT}`);
});
