import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Update profile (User & Super Admin)
router.patch(
  "/me",
  auth("USER", "SUPER_ADMIN"),
  RequestValidation.validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateMyProfile
);

// Admin-only routes (Super Admin)
router.get("/", auth("SUPER_ADMIN"), UserController.getAllUsers);
router.get("/:id", auth("SUPER_ADMIN"), UserController.getSingleUser);
router.patch("/:id/status", auth("SUPER_ADMIN"), UserController.toggleUserStatus);

export const UserRoutes = router;
