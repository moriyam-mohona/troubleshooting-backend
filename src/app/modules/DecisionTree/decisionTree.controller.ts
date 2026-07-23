import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DecisionTreeService } from "./decisionTree.service";

const saveDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;
  const { treeNodes } = req.body;

  const result = await DecisionTreeService.saveDecisionTree(subcategoryId, treeNodes);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Decision tree saved successfully",
    data: result,
  });
});

const getDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.params.subcategoryId as string;

  const result = await DecisionTreeService.getDecisionTree(subcategoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Decision tree fetched successfully",
    data: result,
  });
});

const traverseDecisionTree = catchAsync(async (req: Request, res: Response) => {
  const { subcategoryId, questionId, option } = req.body;

  const result = await DecisionTreeService.traverseDecisionTree(
    subcategoryId,
    questionId,
    option
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Route evaluated successfully",
    data: result,
  });
});

export const DecisionTreeController = {
  saveDecisionTree,
  getDecisionTree,
  traverseDecisionTree,
};
