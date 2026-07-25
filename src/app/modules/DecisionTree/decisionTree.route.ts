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

// SAVE decision tree for a subcategory (Admin only)
router.post(
  "/subcategories/:subcategoryId",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.saveTreeSchema),
  DecisionTreeController.saveDecisionTree
);

// UPDATE decision tree for a subcategory (Admin only)
router.put(
  "/subcategories/:subcategoryId",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.saveTreeSchema),
  DecisionTreeController.updateDecisionTree
);

// TOGGLE draft / publish status of a decision tree (Admin only)
router.patch(
  "/subcategories/:subcategoryId/status",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.toggleStatusSchema),
  DecisionTreeController.toggleDraftStatus
);

// DELETE decision tree for a subcategory (Admin only)
router.delete(
  "/subcategories/:subcategoryId",
  auth("SUPER_ADMIN"),
  DecisionTreeController.deleteDecisionTree
);

// START session for user / mobile app flow
router.post(
  "/session/start",
  auth("USER", "SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.startSessionSchema),
  DecisionTreeController.startSession
);

// RESTART session for user / mobile app flow
router.post(
  "/session/restart",
  auth("USER", "SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.restartSessionSchema),
  DecisionTreeController.restartSession
);

// GET user history list (All, In Progress, Solved)
router.get(
  "/history",
  auth("USER", "SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.historyQuerySchema),
  DecisionTreeController.getUserHistory
);

// GET specific session details (Continue flow)
router.get(
  "/session/:sessionId",
  auth("USER", "SUPER_ADMIN"),
  DecisionTreeController.getSessionById
);

// GET user stats (Self Solved count & Admin Support count)
router.get(
  "/user-stats",
  auth("USER", "SUPER_ADMIN"),
  DecisionTreeController.getUserStats
);

router.get(
  "/stats",
  auth("USER", "SUPER_ADMIN"),
  DecisionTreeController.getUserStats
);

// TRAVERSE step-by-step for user / mobile app flow
router.post(
  "/traverse",
  auth("USER", "SUPER_ADMIN"),
  RequestValidation.validateRequest(DecisionTreeValidation.traverseSchema),
  DecisionTreeController.traverseDecisionTree
);

export const DecisionTreeRoutes = router;
