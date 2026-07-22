import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import { ICreateSubcategoryInput, IUpdateSubcategoryInput } from "./subcategory.interface";

const createSubcategory = async (payload: ICreateSubcategoryInput) => {
  const { title, categoryId } = payload;

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target category not found.");
  }

  const subcategory = await prisma.subcategory.create({
    data: {
      title,
      categoryId,
    },
    include: {
      category: {
        select: {
          id: true,
          title: true,
          subtitle: true,
        },
      },
    },
  });

  return subcategory;
};

const getSubcategoriesByCategoryId = async (categoryId: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

  const subcategories = await prisma.subcategory.findMany({
    where: { categoryId },
    orderBy: {
      createdAt: "asc",
    },
  });

  return subcategories;
};

const updateSubcategory = async (id: string, payload: IUpdateSubcategoryInput) => {
  const existingSubcategory = await prisma.subcategory.findUnique({
    where: { id },
  });

  if (!existingSubcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  const updatedSubcategory = await prisma.subcategory.update({
    where: { id },
    data: {
      title: payload.title,
    },
  });

  return updatedSubcategory;
};

const deleteSubcategory = async (id: string) => {
  const existingSubcategory = await prisma.subcategory.findUnique({
    where: { id },
  });

  if (!existingSubcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  const deletedSubcategory = await prisma.subcategory.delete({
    where: { id },
  });

  return deletedSubcategory;
};

export const SubcategoryService = {
  createSubcategory,
  getSubcategoriesByCategoryId,
  updateSubcategory,
  deleteSubcategory,
};
