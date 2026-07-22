import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { SupportService } from "./support.service";

const createSupport = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await SupportService.createSupport(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Support message submitted successfully. Admin has been notified via email.",
    data: result,
  });
});

const getAllSupportMessages = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["page", "limit"]);

  const result = await SupportService.getAllSupportMessages(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Support messages retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleSupportMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SupportService.getSingleSupportMessage(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Support message details retrieved successfully.",
    data: result,
  });
});

export const SupportController = {
  createSupport,
  getAllSupportMessages,
  getSingleSupportMessage,
};
