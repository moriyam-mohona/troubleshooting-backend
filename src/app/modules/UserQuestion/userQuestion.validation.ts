import { z } from "zod";

const createUserQuestionZodSchema = z.object({
  body: z
    .object({
      subcategoryId: z.string().optional(),
      categoryId: z.string().optional(),
      description: z.string().min(1, "Problem description is required."),
      image: z.string().optional(),
    })
    .refine((data) => Boolean(data.subcategoryId || data.categoryId), {
      message: "Either subcategoryId or categoryId must be provided.",
      path: ["subcategoryId"],
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
