import express from "express";
import morgan from "morgan";
import routes from "./routes/index.route.js";

const app = express();
const PORT = 3000;

app.use(morgan("dev"));
app.use((req, res, next) => {
  next();
});
app.use(routes);

app.listen(PORT, () => {
  console.log(`API Gateway listening on ${PORT}`);
});
