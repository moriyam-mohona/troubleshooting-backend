import { RouteOption, RouteType } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import { ITreeNodePayload } from "./decisionTree.interface";

// Helper function to recursively save node and its routes inside transaction
const saveNodeRecursive = async (
  tx: any,
  subcategoryId: string,
  nodePayload: ITreeNodePayload
): Promise<string> => {
  // 1. Create Question record
  const createdQuestion = await tx.question.create({
    data: {
      question: nodePayload.questionText,
      subCategoryId: subcategoryId,
    },
  });

  const questionId = createdQuestion.id;

  // 2. Process YES Branch
  const yesBranch = nodePayload.yesBranch;
  if (yesBranch.hasDiagnosis && yesBranch.diagnosis) {
    const createdAnswer = await tx.answer.create({
      data: {
        whatsHappening: yesBranch.diagnosis.whatsHappening,
        recommendedFix: yesBranch.diagnosis.recommendedFix,
      },
    });

    await tx.questionRoute.create({
      data: {
        questionId: questionId,
        option: RouteOption.YES,
        nextType: RouteType.ANSWER,
        nextAnswerId: createdAnswer.id,
      },
    });
  } else if (yesBranch.childQuestions && yesBranch.childQuestions.length > 0) {
    const childNode = yesBranch.childQuestions[0];
    const childQuestionId = await saveNodeRecursive(tx, subcategoryId, childNode);

    await tx.questionRoute.create({
      data: {
        questionId: questionId,
        option: RouteOption.YES,
        nextType: RouteType.QUESTION,
        nextQuestionId: childQuestionId,
      },
    });
  }

  // 3. Process NO Branch
  const noBranch = nodePayload.noBranch;
  if (noBranch.hasDiagnosis && noBranch.diagnosis) {
    const createdAnswer = await tx.answer.create({
      data: {
        whatsHappening: noBranch.diagnosis.whatsHappening,
        recommendedFix: noBranch.diagnosis.recommendedFix,
      },
    });

    await tx.questionRoute.create({
      data: {
        questionId: questionId,
        option: RouteOption.NO,
        nextType: RouteType.ANSWER,
        nextAnswerId: createdAnswer.id,
      },
    });
  } else if (noBranch.childQuestions && noBranch.childQuestions.length > 0) {
    const childNode = noBranch.childQuestions[0];
    const childQuestionId = await saveNodeRecursive(tx, subcategoryId, childNode);

    await tx.questionRoute.create({
      data: {
        questionId: questionId,
        option: RouteOption.NO,
        nextType: RouteType.QUESTION,
        nextQuestionId: childQuestionId,
      },
    });
  }

  return questionId;
};

// Helper function to build frontend-friendly recursive tree from database graph
const buildRecursiveTree = async (questionId: string): Promise<ITreeNodePayload | null> => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      routes: {
        include: {
          nextQuestion: true,
          nextAnswer: true,
        },
      },
    },
  });

  if (!question) return null;

  const yesRoute = question.routes.find((r) => r.option === RouteOption.YES);
  const noRoute = question.routes.find((r) => r.option === RouteOption.NO);

  const yesBranchData: ITreeNodePayload["yesBranch"] = {
    hasDiagnosis: yesRoute?.nextType === RouteType.ANSWER,
    diagnosis: yesRoute?.nextAnswer
      ? {
          whatsHappening: yesRoute.nextAnswer.whatsHappening,
          recommendedFix: yesRoute.nextAnswer.recommendedFix,
        }
      : null,
    childQuestions: [],
  };

  if (yesRoute?.nextType === RouteType.QUESTION && yesRoute.nextQuestionId) {
    const childTree = await buildRecursiveTree(yesRoute.nextQuestionId);
    if (childTree) yesBranchData.childQuestions = [childTree];
  }

  const noBranchData: ITreeNodePayload["noBranch"] = {
    hasDiagnosis: noRoute?.nextType === RouteType.ANSWER,
    diagnosis: noRoute?.nextAnswer
      ? {
          whatsHappening: noRoute.nextAnswer.whatsHappening,
          recommendedFix: noRoute.nextAnswer.recommendedFix,
        }
      : null,
    childQuestions: [],
  };

  if (noRoute?.nextType === RouteType.QUESTION && noRoute.nextQuestionId) {
    const childTree = await buildRecursiveTree(noRoute.nextQuestionId);
    if (childTree) noBranchData.childQuestions = [childTree];
  }

  return {
    id: question.id,
    questionText: question.question,
    yesBranch: yesBranchData,
    noBranch: noBranchData,
  };
};

const saveDecisionTree = async (
  subcategoryId: string,
  treeNodes: ITreeNodePayload[],
  isDraft?: boolean
) => {
  const existingSubcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!existingSubcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  if (!treeNodes || treeNodes.length === 0) {
    const finalIsDraft = isDraft !== undefined ? isDraft : (existingSubcategory as any).isDraft ?? false;
    await prisma.subCategory.update({
      where: { id: subcategoryId },
      data: {
        firstQuestionId: null,
        isDraft: finalIsDraft,
      },
    });

    return {
      subcategoryId: existingSubcategory.id,
      subcategoryTitle: existingSubcategory.title,
      categoryTitle: existingSubcategory.category.title,
      isDraft: finalIsDraft,
      message: "Decision tree cleared successfully",
      treeNodes: [] as ITreeNodePayload[],
    };
  }

  if (treeNodes.length > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only one root question tree is allowed per subcategory."
    );
  }

  const finalIsDraft = isDraft !== undefined ? isDraft : (existingSubcategory as any).isDraft ?? false;

  return await prisma.$transaction(async (tx) => {
    // Clean up existing questions for this subcategory
    const existingQuestions = await tx.question.findMany({
      where: { subCategoryId: subcategoryId },
      select: { id: true },
    });

    const existingQuestionIds = existingQuestions.map((q) => q.id);

    if (existingQuestionIds.length > 0) {
      // Find answer IDs linked to these questions to delete orphaned answers
      const routes = await tx.questionRoute.findMany({
        where: { questionId: { in: existingQuestionIds } },
        select: { nextAnswerId: true },
      });

      const answerIdsToDelete = routes
        .map((r) => r.nextAnswerId)
        .filter((id): id is string => id !== null);

      await tx.subCategory.update({
        where: { id: subcategoryId },
        data: { firstQuestionId: null },
      });

      await tx.question.deleteMany({
        where: { subCategoryId: subcategoryId },
      });

      if (answerIdsToDelete.length > 0) {
        await tx.answer.deleteMany({
          where: { id: { in: answerIdsToDelete } },
        });
      }
    }

    // Save root question node
    const rootNodePayload = treeNodes[0];
    const rootQuestionId = await saveNodeRecursive(tx, subcategoryId, rootNodePayload);

    // Link subcategory to root question and set draft status
    await tx.subCategory.update({
      where: { id: subcategoryId },
      data: {
        firstQuestionId: rootQuestionId,
        isDraft: finalIsDraft,
      },
    });

    const updatedTree = await buildRecursiveTree(rootQuestionId);

    return {
      subcategoryId,
      subcategoryTitle: existingSubcategory.title,
      categoryTitle: existingSubcategory.category.title,
      isDraft: finalIsDraft,
      rootQuestionId,
      treeNodes: updatedTree ? [updatedTree] : [],
    };
  });
};

const toggleDraftStatus = async (subcategoryId: string, isDraft: boolean) => {
  const existingSubcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: {
        select: { title: true },
      },
    },
  });

  if (!existingSubcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  const updatedSubcategory = await prisma.subCategory.update({
    where: { id: subcategoryId },
    data: { isDraft },
  });

  return {
    subcategoryId: updatedSubcategory.id,
    subcategoryTitle: updatedSubcategory.title,
    categoryTitle: existingSubcategory.category.title,
    isDraft: (updatedSubcategory as any).isDraft ?? isDraft,
    message: isDraft
      ? "Decision tree saved as draft."
      : "Decision tree published successfully.",
  };
};

const getDecisionTree = async (subcategoryId: string, userRole?: string) => {
  const subcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!subcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  const isDraft = (subcategory as any).isDraft ?? false;
  const isAdmin = userRole === "SUPER_ADMIN";

  // If the decision tree is in draft mode, hide tree nodes for standard users
  if (isDraft && !isAdmin) {
    return {
      subcategoryId: subcategory.id,
      subcategoryTitle: subcategory.title,
      categoryTitle: subcategory.category.title,
      isDraft: true,
      treeNodes: [],
      message: "Decision tree for this subcategory is currently in draft mode.",
    };
  }

  if (!subcategory.firstQuestionId) {
    return {
      subcategoryId: subcategory.id,
      subcategoryTitle: subcategory.title,
      categoryTitle: subcategory.category.title,
      isDraft,
      treeNodes: [],
    };
  }

  const rootTree = await buildRecursiveTree(subcategory.firstQuestionId);

  return {
    subcategoryId: subcategory.id,
    subcategoryTitle: subcategory.title,
    categoryTitle: subcategory.category.title,
    isDraft,
    treeNodes: rootTree ? [rootTree] : [],
  };
};

const traverseDecisionTree = async (
  subcategoryId: string,
  questionId: string,
  option: RouteOption,
  userRole?: string
) => {
  const subcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    select: { isDraft: true },
  });

  if (!subcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  if ((subcategory as any).isDraft && userRole !== "SUPER_ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "This decision tree is currently in draft mode and cannot be traversed."
    );
  }

  const route = await prisma.questionRoute.findFirst({
    where: {
      questionId,
      option,
    },
    include: {
      nextQuestion: true,
      nextAnswer: true,
    },
  });

  if (!route) {
    throw new ApiError(httpStatus.NOT_FOUND, "No configured route found for this option.");
  }

  if (route.nextType === RouteType.ANSWER && route.nextAnswer) {
    return {
      isComplete: true,
      nextType: RouteType.ANSWER,
      answer: {
        id: route.nextAnswer.id,
        whatsHappening: route.nextAnswer.whatsHappening,
        recommendedFix: route.nextAnswer.recommendedFix,
      },
    };
  }

  if (route.nextType === RouteType.QUESTION && route.nextQuestion) {
    return {
      isComplete: false,
      nextType: RouteType.QUESTION,
      nextQuestion: {
        id: route.nextQuestion.id,
        question: route.nextQuestion.question,
      },
    };
  }

  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Invalid route configuration.");
};

const deleteDecisionTree = async (subcategoryId: string) => {
  const existingSubcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!existingSubcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  return await prisma.$transaction(async (tx) => {
    const existingQuestions = await tx.question.findMany({
      where: { subCategoryId: subcategoryId },
      select: { id: true },
    });

    const existingQuestionIds = existingQuestions.map((q) => q.id);

    if (existingQuestionIds.length > 0) {
      const routes = await tx.questionRoute.findMany({
        where: { questionId: { in: existingQuestionIds } },
        select: { nextAnswerId: true },
      });

      const answerIdsToDelete = routes
        .map((r) => r.nextAnswerId)
        .filter((id): id is string => id !== null);

      await tx.subCategory.update({
        where: { id: subcategoryId },
        data: { firstQuestionId: null },
      });

      await tx.question.deleteMany({
        where: { subCategoryId: subcategoryId },
      });

      if (answerIdsToDelete.length > 0) {
        await tx.answer.deleteMany({
          where: { id: { in: answerIdsToDelete } },
        });
      }
    }

    return {
      subcategoryId: existingSubcategory.id,
      subcategoryTitle: existingSubcategory.title,
      categoryTitle: existingSubcategory.category.title,
    };
  });
};

export const DecisionTreeService = {
  saveDecisionTree,
  updateDecisionTree: saveDecisionTree,
  toggleDraftStatus,
  getDecisionTree,
  traverseDecisionTree,
  deleteDecisionTree,
};
