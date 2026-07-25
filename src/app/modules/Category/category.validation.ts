import { z } from "zod";

const createCategoryZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Category title is required."),
    subtitle: z.string().min(1, "Category subtitle is required."),
    subcategories: z
      .array(
        z.object({
          title: z.string().min(1, "Subcategory title cannot be empty."),
        })
      )
      .optional(),
  }),
});

const updateCategoryZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Category title cannot be empty.").optional(),
    subtitle: z.string().min(1, "Category subtitle cannot be empty.").optional(),
    subcategories: z
      .array(
        z.object({
          id: z.string().min(1, "Subcategory ID is required.").optional(),
          title: z.string().min(1, "Subcategory title cannot be empty."),
        })
      )
      .optional(),
  }),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
