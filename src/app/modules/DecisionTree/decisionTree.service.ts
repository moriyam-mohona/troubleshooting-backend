import { RouteOption, RouteType, SessionStatus } from "@prisma/client";
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

  return await prisma.$transaction(
    async (tx) => {
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
  }, {
    // maxWait: 15000,
    timeout: 60000,
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

const startSession = async (userId: string, subcategoryId: string, userRole?: string) => {
  const subcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: { select: { title: true } },
      firstQuestion: true,
    },
  });

  if (!subcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  if (subcategory.isDraft && userRole !== "SUPER_ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "This decision tree is currently in draft mode."
    );
  }

  if (!subcategory.firstQuestionId || !subcategory.firstQuestion) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Decision tree has not been configured for this subcategory yet."
    );
  }

  // Check if user already has an IN_PROGRESS session for this subcategory
  let session = await prisma.userTreeSession.findFirst({
    where: {
      userId,
      subcategoryId,
      status: SessionStatus.IN_PROGRESS,
    },
    include: {
      currentQuestion: true,
    },
  });

  // If no active session, create a new one
  if (!session) {
    session = await prisma.userTreeSession.create({
      data: {
        userId,
        subcategoryId,
        currentQuestionId: subcategory.firstQuestionId,
        currentStep: 1,
        status: SessionStatus.IN_PROGRESS,
        historyPath: [],
      },
      include: {
        currentQuestion: true,
      },
    });
  }

  return {
    sessionId: session.id,
    subcategoryId: session.subcategoryId,
    subcategoryTitle: subcategory.title,
    categoryTitle: subcategory.category.title,
    currentStep: session.currentStep,
    status: session.status,
    isComplete: false,
    currentQuestion: session.currentQuestion
      ? {
          id: session.currentQuestion.id,
          question: session.currentQuestion.question,
        }
      : null,
  };
};

const restartSession = async (userId: string, subcategoryId: string, userRole?: string) => {
  const subcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: { select: { title: true } },
      firstQuestion: true,
    },
  });

  if (!subcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found.");
  }

  if (subcategory.isDraft && userRole !== "SUPER_ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "This decision tree is currently in draft mode."
    );
  }

  if (!subcategory.firstQuestionId || !subcategory.firstQuestion) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Decision tree has not been configured for this subcategory yet."
    );
  }

  // Delete existing IN_PROGRESS sessions for this subcategory to start fresh
  await prisma.userTreeSession.deleteMany({
    where: {
      userId,
      subcategoryId,
      status: SessionStatus.IN_PROGRESS,
    },
  });

  const session = await prisma.userTreeSession.create({
    data: {
      userId,
      subcategoryId,
      currentQuestionId: subcategory.firstQuestionId,
      currentStep: 1,
      status: SessionStatus.IN_PROGRESS,
      historyPath: [],
    },
    include: {
      currentQuestion: true,
    },
  });

  return {
    sessionId: session.id,
    subcategoryId: session.subcategoryId,
    subcategoryTitle: subcategory.title,
    categoryTitle: subcategory.category.title,
    currentStep: session.currentStep,
    status: session.status,
    isComplete: false,
    currentQuestion: session.currentQuestion
      ? {
          id: session.currentQuestion.id,
          question: session.currentQuestion.question,
        }
      : null,
  };
};

const traverseDecisionTree = async (
  subcategoryId: string,
  questionId: string,
  option: RouteOption,
  userId?: string,
  sessionId?: string,
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
      question: true,
      nextQuestion: true,
      nextAnswer: true,
    },
  });

  if (!route) {
    throw new ApiError(httpStatus.NOT_FOUND, "No configured route found for this option.");
  }

  let session = null;
  if (userId) {
    if (sessionId) {
      session = await prisma.userTreeSession.findFirst({
        where: { id: sessionId, userId },
      });
    }

    if (!session) {
      session = await prisma.userTreeSession.findFirst({
        where: { userId, subcategoryId, status: SessionStatus.IN_PROGRESS },
      });
    }

    if (!session) {
      session = await prisma.userTreeSession.create({
        data: {
          userId,
          subcategoryId,
          currentQuestionId: questionId,
          currentStep: 1,
          status: SessionStatus.IN_PROGRESS,
          historyPath: [],
        },
      });
    }
  }

  const isAnswer = route.nextType === RouteType.ANSWER && route.nextAnswer;
  const isQuestion = route.nextType === RouteType.QUESTION && route.nextQuestion;

  if (!isAnswer && !isQuestion) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Invalid route configuration.");
  }

  if (session) {
    const existingHistory: any[] = Array.isArray(session.historyPath)
      ? (session.historyPath as any[])
      : [];

    const newHistoryItem = {
      step: session.currentStep,
      questionId,
      questionText: route.question?.question || "",
      optionChosen: option,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...existingHistory, newHistoryItem];
    const nextStep = session.currentStep + 1;

    if (isAnswer && route.nextAnswer) {
      const updatedSession = await prisma.userTreeSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.SOLVED,
          currentQuestionId: null,
          finalAnswerId: route.nextAnswer.id,
          currentStep: nextStep,
          historyPath: updatedHistory,
        },
      });

      return {
        sessionId: updatedSession.id,
        currentStep: nextStep,
        isComplete: true,
        status: SessionStatus.SOLVED,
        nextType: RouteType.ANSWER,
        answer: {
          id: route.nextAnswer.id,
          whatsHappening: route.nextAnswer.whatsHappening,
          recommendedFix: route.nextAnswer.recommendedFix,
        },
      };
    }

    if (isQuestion && route.nextQuestion) {
      const updatedSession = await prisma.userTreeSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.IN_PROGRESS,
          currentQuestionId: route.nextQuestion.id,
          currentStep: nextStep,
          historyPath: updatedHistory,
        },
      });

      return {
        sessionId: updatedSession.id,
        currentStep: nextStep,
        isComplete: false,
        status: SessionStatus.IN_PROGRESS,
        nextType: RouteType.QUESTION,
        nextQuestion: {
          id: route.nextQuestion.id,
          question: route.nextQuestion.question,
        },
      };
    }
  }

  // Fallback for unauthenticated / non-session traversal
  if (isAnswer && route.nextAnswer) {
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

  return {
    isComplete: false,
    nextType: RouteType.QUESTION,
    nextQuestion: {
      id: route.nextQuestion!.id,
      question: route.nextQuestion!.question,
    },
  };
};

const getUserHistory = async (
  userId: string,
  statusFilter?: "ALL" | "IN_PROGRESS" | "SOLVED"
) => {
  const whereCondition: any = { userId };
  if (statusFilter && statusFilter !== "ALL") {
    whereCondition.status = statusFilter as SessionStatus;
  }

  const sessions = await prisma.userTreeSession.findMany({
    where: whereCondition,
    include: {
      subcategory: {
        include: {
          category: { select: { id: true, title: true } },
        },
      },
      currentQuestion: { select: { id: true, question: true } },
      finalAnswer: { select: { id: true, whatsHappening: true, recommendedFix: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return sessions.map((session) => {
    let lastQuestionText = session.currentQuestion?.question;

    if (!lastQuestionText && Array.isArray(session.historyPath) && session.historyPath.length > 0) {
      const lastEntry = session.historyPath[session.historyPath.length - 1] as any;
      lastQuestionText = lastEntry?.questionText;
    }

    if (!lastQuestionText) {
      lastQuestionText = session.subcategory.title;
    }

    return {
      sessionId: session.id,
      subcategoryId: session.subcategoryId,
      subcategoryTitle: session.subcategory.title,
      categoryTitle: session.subcategory.category.title,
      lastQuestionText,
      currentStep: session.currentStep,
      status: session.status,
      canContinue: session.status === SessionStatus.IN_PROGRESS && !!session.currentQuestionId,
      updatedAt: session.updatedAt,
      createdAt: session.createdAt,
    };
  });
};

const getSessionById = async (userId: string, sessionId: string) => {
  const session = await prisma.userTreeSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      subcategory: {
        include: {
          category: { select: { id: true, title: true } },
        },
      },
      currentQuestion: { select: { id: true, question: true } },
      finalAnswer: { select: { id: true, whatsHappening: true, recommendedFix: true } },
    },
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, "Troubleshooting session not found.");
  }

  return {
    sessionId: session.id,
    subcategoryId: session.subcategoryId,
    subcategoryTitle: session.subcategory.title,
    categoryTitle: session.subcategory.category.title,
    currentStep: session.currentStep,
    status: session.status,
    isComplete: session.status === SessionStatus.SOLVED,
    currentQuestion: session.currentQuestion
      ? {
          id: session.currentQuestion.id,
          question: session.currentQuestion.question,
        }
      : null,
    finalAnswer: session.finalAnswer
      ? {
          id: session.finalAnswer.id,
          whatsHappening: session.finalAnswer.whatsHappening,
          recommendedFix: session.finalAnswer.recommendedFix,
        }
      : null,
    historyPath: session.historyPath || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
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

  return await prisma.$transaction(
    async (tx) => {
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
    },
    {
      maxWait: 15000,
      timeout: 60000,
    }
  );
};

const getUserStats = async (userId: string) => {
  const [selfSolvedCount, adminSupportCount, inProgressCount] = await Promise.all([
    prisma.userTreeSession.count({
      where: {
        userId,
        status: SessionStatus.SOLVED,
      },
    }),
    prisma.userQuestion.count({
      where: {
        userId,
      },
    }),
    prisma.userTreeSession.count({
      where: {
        userId,
        status: SessionStatus.IN_PROGRESS,
      },
    }),
  ]);

  return {
    selfSolved: selfSolvedCount,
    adminSupport: adminSupportCount,
    inProgress: inProgressCount,
  };
};

export const DecisionTreeService = {
  saveDecisionTree,
  updateDecisionTree: saveDecisionTree,
  toggleDraftStatus,
  getDecisionTree,
  startSession,
  restartSession,
  traverseDecisionTree,
  getUserHistory,
  getSessionById,
  getUserStats,
  deleteDecisionTree,
};
