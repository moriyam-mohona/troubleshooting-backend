import express from "express";
import { imageUploader } from "../../../helpers/file_uploader/imageUploader";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { UserQuestionController } from "./userQuestion.controller";
import { UserQuestionValidation } from "./userQuestion.validation";

const router = express.Router();

// User routes
router.post(
  "/",
  auth("USER"),
  imageUploader.single("image"),
  (req, res, next) => {
    if (typeof req.body.data === "string") {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  RequestValidation.validateRequest(UserQuestionValidation.createUserQuestionZodSchema),
  UserQuestionController.createUserQuestion
);

router.get("/my-questions", auth("USER"), UserQuestionController.getMyQuestions);

// Admin-only routes
router.get("/", auth("SUPER_ADMIN"), UserQuestionController.getAllUserQuestions);
router.get("/:id", auth("USER", "SUPER_ADMIN"), UserQuestionController.getSingleUserQuestion);

router.post(
  "/:id/reply",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(UserQuestionValidation.replyUserQuestionZodSchema),
  UserQuestionController.replyUserQuestion
);

export const UserQuestionRoutes = router;
