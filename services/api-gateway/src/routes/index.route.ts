import { Router } from "express";
import { userProxy, authProxy, organizerProxy } from "../proxy/users.proxy.js";

const router = Router();

router.use("/api/v1/users", userProxy);
router.use("/api/v1/organizer/users", organizerProxy);
router.use("/api/v1/auth", authProxy);

router.get("/", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
  });
});

export default router;
