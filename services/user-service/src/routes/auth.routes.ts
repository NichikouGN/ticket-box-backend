import { Router } from "express";
import { signup, signin, requestNewAccessToken } from "../controller/auth.controller.js";
const router = Router();

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/refresh-token", requestNewAccessToken);

router.use((req, res) => {
  console.log("Auth Routes: Unhandled request:", req.method, req.originalUrl);
  res.status(404).json({ message: "Not Found" });
});

export default router;
