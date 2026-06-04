import express from "express";
import routes from "./routes/index.route.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(routes);

app.listen(PORT, () => {
  console.log(`User Service listening on ${PORT}`);
});
