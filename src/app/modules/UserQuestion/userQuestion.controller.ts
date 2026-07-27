import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { UserQuestionService } from "./userQuestion.service";

const createUserQuestion = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  let imagePath: string | undefined;

  if (req.file) {
    imagePath = `/uploads/images/${req.file.filename}`;
  }

  const result = await UserQuestionService.createUserQuestion(userId, req.body, imagePath);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Question submitted successfully to admin.",
    data: result,
  });
});

const getAllUserQuestions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status", "subcategoryId", "categoryId"]);
  const options = pick(req.query, ["page", "limit"]);

  const result = await UserQuestionService.getAllUserQuestions(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User questions retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getMyQuestions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = pick(req.query, ["page", "limit"]);

  const result = await UserQuestionService.getMyQuestions(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My submitted questions retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleUserQuestion = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserQuestionService.getSingleUserQuestion(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Question details retrieved successfully.",
    data: result,
  });
});

const replyUserQuestion = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserQuestionService.replyUserQuestion(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reply sent successfully and user has been notified via email.",
    data: result,
  });
});

export const UserQuestionController = {
  createUserQuestion,
  getAllUserQuestions,
  getMyQuestions,
  getSingleUserQuestion,
  replyUserQuestion,
};
