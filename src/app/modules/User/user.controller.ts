import { Request, Response } from "express";
import httpStatus from "http-status";
import { getFullImageUrl } from "../../../helpers/file_uploader/imageUploader";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status", "isEmailVerified"]);
  const options = pick(req.query, ["page", "limit"]);

  const result = await UserService.getAllUsers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.getSingleUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User details retrieved successfully.",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  if (req.file) {
    req.body.profilePicture = getFullImageUrl(req, req.file);
  } else if (req.body.profilePicture) {
    req.body.profilePicture = getFullImageUrl(req, req.body.profilePicture);
  }

  const result = await UserService.updateMyProfile(userId, req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully.",
    data: result,
  });
});

const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.toggleUserStatus(id);

  const statusAction = result.status === "BLOCKED" ? "blocked" : "unblocked";

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is ${statusAction} successfully.`,
    data: result,
  });
});

export const UserController = {
  getAllUsers,
  getSingleUser,
  updateMyProfile,
  toggleUserStatus,
};
