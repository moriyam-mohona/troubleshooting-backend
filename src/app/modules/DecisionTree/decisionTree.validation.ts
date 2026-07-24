import { z } from "zod";

const diagnosisSchema = z.object({
  whatsHappening: z.string().min(1, "What's happening field is required"),
  recommendedFix: z.string().min(1, "Recommended fix field is required"),
});

const treeNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    questionText: z.string().min(1, "Question text cannot be empty"),
    selectedOption: z.enum(["Yes", "No"]).optional(),
    yesBranch: z.object({
      hasDiagnosis: z.boolean(),
      diagnosis: diagnosisSchema.nullable().optional(),
      childQuestions: z.array(treeNodeSchema).optional(),
    }),
    noBranch: z.object({
      hasDiagnosis: z.boolean(),
      diagnosis: diagnosisSchema.nullable().optional(),
      childQuestions: z.array(treeNodeSchema).optional(),
    }),
  })
);

export const DecisionTreeValidation = {
  saveTreeSchema: z.object({
    body: z.object({
      isDraft: z.boolean().optional(),
      treeNodes: z
        .array(treeNodeSchema)
        .max(1, "Only one root question tree is allowed per subcategory"),
    }),
  }),
  toggleStatusSchema: z.object({
    body: z.object({
      isDraft: z.boolean(),
    }),
  }),
  traverseSchema: z.object({
    body: z.object({
      subcategoryId: z.string().min(1, "Subcategory ID is required"),
      questionId: z.string().min(1, "Question ID is required"),
      option: z.enum(["YES", "NO"]),
    }),
  }),
};
