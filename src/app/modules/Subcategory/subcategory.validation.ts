import { z } from "zod";

const createSubcategoryZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Subcategory title is required."),
    categoryId: z.string().min(1, "Category ID is required."),
  }),
});

const updateSubcategoryZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Subcategory title is required."),
  }),
});

export const SubcategoryValidation = {
  createSubcategoryZodSchema,
  updateSubcategoryZodSchema,
};
