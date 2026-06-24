import { Router } from "express";
import { AuthController } from "../controller/auth.controller.js";
const router = Router();

router.post("/sign-up", AuthController.signup);
router.post("/sign-in", AuthController.signin);
router.post("/refresh-token", AuthController.requestNewAccessToken);

router.use((req, res) => {
  console.log("Auth Routes: Unhandled request:", req.method, req.originalUrl);
  res.status(404).json({ message: "Not Found" });
});

export default router;
