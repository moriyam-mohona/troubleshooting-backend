import { z } from "zod";

const createUserQuestionZodSchema = z.object({
  body: z.object({
    subcategoryId: z.string().min(1, "Subcategory ID is required."),
    description: z.string().min(1, "Problem description is required."),
    image: z.string().optional(),
  }),
});

const replyUserQuestionZodSchema = z.object({
  body: z.object({
    adminReply: z.string().min(1, "Reply text cannot be empty."),
  }),
});

export const UserQuestionValidation = {
  createUserQuestionZodSchema,
  replyUserQuestionZodSchema,
};
