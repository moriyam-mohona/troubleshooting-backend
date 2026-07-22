import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { SupportController } from "./support.controller";
import { SupportValidation } from "./support.validation";

const router = express.Router();

// User route (authenticated user submits support message)
router.post(
  "/",
  auth("USER"),
  RequestValidation.validateRequest(SupportValidation.createSupportZodSchema),
  SupportController.createSupport
);

// Admin routes
router.get("/", auth("SUPER_ADMIN"), SupportController.getAllSupportMessages);
router.get("/:id", auth("SUPER_ADMIN"), SupportController.getSingleSupportMessage);

export const SupportRoutes = router;
