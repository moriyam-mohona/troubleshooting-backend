import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DecisionTreeService } from "./decisionTree.service";

const saveDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;
  const { treeNodes, isDraft } = req.body;

  const result = await DecisionTreeService.saveDecisionTree(
    subcategoryId,
    treeNodes,
    isDraft
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isDraft
      ? "Decision tree saved as draft successfully"
      : "Decision tree saved & published successfully",
    data: result,
  });
});

const updateDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;
  const { treeNodes, isDraft } = req.body;

  const result = await DecisionTreeService.updateDecisionTree(
    subcategoryId,
    treeNodes,
    isDraft
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isDraft
      ? "Decision tree updated as draft successfully"
      : "Decision tree updated & published successfully",
    data: result,
  });
});

const toggleDraftStatus = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;
  const { isDraft } = req.body;

  const result = await DecisionTreeService.toggleDraftStatus(subcategoryId, isDraft);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;
  const userRole = (req as any).user?.role;

  const result = await DecisionTreeService.getDecisionTree(subcategoryId, userRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Decision tree fetched successfully",
    data: result,
  });
});

const traverseDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const { subcategoryId, questionId, option } = req.body;
  const userRole = (req as any).user?.role;

  const result = await DecisionTreeService.traverseDecisionTree(
    subcategoryId,
    questionId,
    option,
    userRole
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Route evaluated successfully",
    data: result,
  });
});

const deleteDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;

  const result = await DecisionTreeService.deleteDecisionTree(subcategoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Decision tree deleted successfully",
    data: result,
  });
});

export const DecisionTreeController = {
  saveDecisionTree,
  updateDecisionTree,
  toggleDraftStatus,
  getDecisionTree,
  traverseDecisionTree,
  deleteDecisionTree,
};
