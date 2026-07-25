import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getDashboardSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardService.getDashboardSummary();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard summary retrieved successfully.",
    data: result,
  });
});

const getRecentActivities = catchAsync(async (req: Request, res: Response) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limit = typeof req.query.limit === "string" ? req.query.limit : undefined;

  const result = await DashboardService.getRecentActivities({
    cursor,
    limit,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recent activities retrieved successfully.",
    data: result,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  const result = await DashboardService.getUserStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User stats retrieved successfully.",
    data: result,
  });
});

export const DashboardController = {
  getDashboardSummary,
  getRecentActivities,
  getUserStats,
};
