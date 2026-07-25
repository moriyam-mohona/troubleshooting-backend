import express from "express";
import { imageUploader } from "../../../helpers/file_uploader/imageUploader";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Update profile (User & Super Admin)
router.patch(
  "/me",
  auth("USER", "SUPER_ADMIN"),
  imageUploader.single("profilePicture"),
  (req, res, next) => {
    if (typeof req.body.data === "string") {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (e) {
        // Ignore parse error
      }
    }
    next();
  },
  RequestValidation.validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateMyProfile
);

// Admin-only routes (Super Admin)
router.get("/", auth("SUPER_ADMIN"), UserController.getAllUsers);
router.get("/:id", auth("SUPER_ADMIN"), UserController.getSingleUser);
router.patch("/:id/status", auth("SUPER_ADMIN"), UserController.toggleUserStatus);

export const UserRoutes = router;
