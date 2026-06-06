import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
  });
});

app.listen(PORT, () => {
  console.log(`User Service listening on ${PORT}`);
});
