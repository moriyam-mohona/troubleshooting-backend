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
      ...(subcategories &&
        subcategories.length > 0 && {
          subcategories: {
            create: subcategories.map((sub) => ({
              title: sub.title,
            })),
          },
        }),
    },
    include: {
      subcategories: true,
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

  const formattedCategories = categories.map(({ _count, ...category }) => ({
    ...category,
    subcategoryCount: _count.subcategories,
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
    },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

  return {
    subcategoryCount: category.subcategories.length,
    ...category,
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

  const { subcategories, ...categoryData } = payload;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(categoryData).length > 0) {
      await tx.category.update({
        where: { id },
        data: categoryData,
      });
    }

    if (subcategories !== undefined) {
      const existingSubcategories = await tx.subCategory.findMany({
        where: { categoryId: id },
        select: { id: true },
      });

      const desiredExistingSubcategoryIds = subcategories
        .map((subcategory) => subcategory.id)
        .filter((subcategoryId): subcategoryId is string => Boolean(subcategoryId));

      for (const subcategory of subcategories) {
        if (subcategory.id) {
          const existingSubcategory = await tx.subCategory.findFirst({
            where: {
              id: subcategory.id,
              categoryId: id,
            },
          });

          if (!existingSubcategory) {
            throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
          }

          await tx.subCategory.update({
            where: { id: subcategory.id },
            data: {
              title: subcategory.title,
            },
          });
        } else {
          await tx.subCategory.create({
            data: {
              title: subcategory.title,
              categoryId: id,
            },
          });
        }
      }

      const existingSubcategoryIds = existingSubcategories.map((subcategory) => subcategory.id);
      const subcategoryIdsToDelete = existingSubcategoryIds.filter(
        (subcategoryId) => !desiredExistingSubcategoryIds.includes(subcategoryId)
      );

      if (subcategoryIdsToDelete.length > 0) {
        await tx.subCategory.deleteMany({
          where: {
            categoryId: id,
            id: {
              in: subcategoryIdsToDelete,
            },
          },
        });
      }
    }
  });

  const updatedCategory = await prisma.category.findUnique({
    where: { id },
    include: {
      subcategories: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!updatedCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
  }

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
