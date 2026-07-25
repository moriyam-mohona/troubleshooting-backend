import { z } from "zod";

const updateProfileZodSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name cannot be empty.")
      .max(100, "Name cannot exceed 100 characters.")
      .optional(),
    profilePicture: z.string().optional(),
  }),
});

export const UserValidation = {
  updateProfileZodSchema,
};
