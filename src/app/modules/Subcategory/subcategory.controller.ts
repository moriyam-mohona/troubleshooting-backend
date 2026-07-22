import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SubcategoryService } from "./subcategory.service";

const createSubcategory = catchAsync(async (req: Request, res: Response) => {
  const result = await SubcategoryService.createSubcategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subcategory created successfully.",
    data: result,
  });
});

const getSubcategoriesByCategoryId = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId as string;
  const result = await SubcategoryService.getSubcategoriesByCategoryId(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subcategories retrieved successfully.",
    data: result,
  });
});

const updateSubcategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SubcategoryService.updateSubcategory(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subcategory updated successfully.",
    data: result,
  });
});

const deleteSubcategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SubcategoryService.deleteSubcategory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subcategory deleted successfully.",
    data: result,
  });
});

export const SubcategoryController = {
  createSubcategory,
  getSubcategoriesByCategoryId,
  updateSubcategory,
  deleteSubcategory,
};
