import express from "express";
import auth from "../../middlewares/auth";
import { DashboardController } from "./dashboard.controller";

const router = express.Router();

router.get("/summary", auth("SUPER_ADMIN"), DashboardController.getDashboardSummary);
router.get("/recent-activities", auth("SUPER_ADMIN"), DashboardController.getRecentActivities);
router.get("/user-stats", auth("USER", "SUPER_ADMIN"), DashboardController.getUserStats);

export const DashboardRoutes = router;
