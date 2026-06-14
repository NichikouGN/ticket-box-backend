import express from "express";
import authRoutes from "./routes/auth.routes.js";
import organizerRoutes from "./routes/organizer.routes.js";
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js";
import internalRoutes from "./routes/internal.routes.js";

const app = express();
const PORT = 3001;

app.use(morgan("dev"));
app.use(express.json());

app.use("/internal", internalRoutes);
app.use("/auth", authRoutes);
app.use("/organizer", organizerRoutes);
app.use("/", userRoutes);

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`User Service listening on ${PORT}`);
});
