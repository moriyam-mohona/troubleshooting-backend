import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { DecisionTreeController } from "./decisionTree.controller";
import { DecisionTreeValidation } from "./decisionTree.validation";

const router = express.Router();

// GET decision tree for a subcategory
router.get(
  "/subcategories/:subcategoryId",
  auth("USER", "SUPER_ADMIN"),
  DecisionTreeController.getDecisionTree
);

// SAVE / UPDATE decision tree for a subcategory (Admin only)
router.post(
  "/subcategories/:subcategoryId",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.saveTreeSchema),
  DecisionTreeController.saveDecisionTree
);

// TRAVERSE step-by-step for user / mobile app flow
router.post(
  "/traverse",
  auth("USER", "SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.traverseSchema),
  DecisionTreeController.traverseDecisionTree
);

export const DecisionTreeRoutes = router;
