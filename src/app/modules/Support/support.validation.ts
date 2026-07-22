import { z } from "zod";

const createSupportZodSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Message is required."),
  }),
});

export const SupportValidation = {
  createSupportZodSchema,
};
