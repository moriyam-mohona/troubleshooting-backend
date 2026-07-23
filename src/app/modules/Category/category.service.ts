import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import {
  ICategoryFilterRequest,
  ICreateCategoryInput,
  IUpdateCategoryInput,
} from "./category.interface";

const createCategory = async (payload: ICreateCategoryInput) => {
  const { title, subtitle, subcategories } = payload;

  const category = await prisma.category.create({
    data: {
      title,
      subtitle,
      ...(subcategories && subcategories.length > 0 && {
        subcategories: {
          create: subcategories.map((sub) => ({
            title: sub.title,
          })),
        },
      }),
    },
    include: {
      subcategories: true,
      _count: {
        select: {
          subcategories: true,
        },
      },
    },
  });

  return {
    ...category,
    subcategoryCount: category.subcategories.length,
  };
};

const getAllCategories = async (filters: ICategoryFilterRequest) => {
  const { searchTerm } = filters;

  const andConditions: Prisma.CategoryWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { subtitle: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const whereConditions: Prisma.CategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const categories = await prisma.category.findMany({
    where: whereConditions,
    include: {
      subcategories: {
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          subcategories: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedCategories = categories.map((category) => ({
    ...category,
    subcategoryCount: category.subcategories.length,
  }));

  return formattedCategories;
};

const getSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subcategories: {
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          subcategories: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

  return {
    ...category,
    subcategoryCount: category.subcategories.length,
  };
};

const getSubcategoriesByCategoryId = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

  const subcategories = await prisma.subCategory.findMany({
    where: { categoryId },
    orderBy: {
      createdAt: "asc",
    },
  });

  return subcategories;
};

const updateCategory = async (id: string, payload: IUpdateCategoryInput) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: payload,
    include: {
      subcategories: true,
      _count: {
        select: {
          subcategories: true,
        },
      },
    },
  });

  return {
    ...updatedCategory,
    subcategoryCount: updatedCategory.subcategories.length,
  };
};

const deleteCategory = async (id: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

  const deletedCategory = await prisma.category.delete({
    where: { id },
    include: {
      subcategories: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return {
    ...deletedCategory,
    subcategoryCount: deletedCategory.subcategories.length,
  };
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  getSubcategoriesByCategoryId,
  updateCategory,
  deleteCategory,
};
