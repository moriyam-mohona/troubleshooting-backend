import { Prisma, UserQuestionStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import emailSender from "../../../helpers/email_sender/emailSender";
import prisma from "../../../lib/prisma";
import { questionAnswerEmail } from "../../../shared/emails/questionAnswerEmail";
import {
  ICreateUserQuestionInput,
  IPaginationOptions,
  IReplyUserQuestionInput,
  IUserQuestionFilterRequest,
} from "./userQuestion.interface";

type UserQuestionBase = {
  id: string;
  userId: string;
  subcategoryId: string;
  description: string;
  image: string | null;
  status: UserQuestionStatus;
  adminReply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const userQuestionBaseSelect = {
  id: true,
  userId: true,
  subcategoryId: true,
  description: true,
  image: true,
  status: true,
  adminReply: true,
  repliedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserQuestionSelect;

const hydrateUserQuestions = async (questions: UserQuestionBase[]) => {
  if (questions.length === 0) {
    return [];
  }

  const userIds = [...new Set(questions.map((question) => question.userId))];
  const subcategoryIds = [...new Set(questions.map((question) => question.subcategoryId))];

  const [users, subcategories] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
    prisma.subCategory.findMany({
      where: { id: { in: subcategoryIds } },
      include: { category: true },
    }),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const subcategoryMap = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory]));

  return questions.map((question) => ({
    ...question,
    user: userMap.get(question.userId) ?? null,
    subcategory: subcategoryMap.get(question.subcategoryId) ?? null,
  }));
};

const hydrateUserQuestion = async (question: UserQuestionBase | null) => {
  if (!question) {
    return null;
  }

  const [hydratedQuestion] = await hydrateUserQuestions([question]);

  return hydratedQuestion;
};

const formatAdminUserQuestion = (question: Awaited<ReturnType<typeof hydrateUserQuestion>>) => {
  if (!question) {
    return question;
  }

  return {
    id: question.id,
    description: question.description,
    image: question.image,
    status: question.status,
    adminReply: question.adminReply,
    repliedAt: question.repliedAt,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    user: question.user
      ? {
          id: question.user.id,
          name: question.user.name,
          email: question.user.email,
        }
      : null,
    subcategory: question.subcategory
      ? {
          title: question.subcategory.title,
        }
      : null,
  };
};

const createUserQuestion = async (
  userId: string,
  payload: ICreateUserQuestionInput,
  imagePath?: string
) => {
  const { subcategoryId, description } = payload;

  const existingSubcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
  });

  if (!existingSubcategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target subcategory not found.");
  }

  const question = await prisma.userQuestion.create({
    data: {
      userId,
      subcategoryId,
      description,
      image: imagePath || payload.image,
      status: UserQuestionStatus.PENDING,
    },
    select: userQuestionBaseSelect,
  });

  return hydrateUserQuestion(question);
};

const getAllUserQuestions = async (
  filters: IUserQuestionFilterRequest,
  options: IPaginationOptions
) => {
  const { searchTerm, status, subcategoryId } = filters;

  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const andConditions: Prisma.UserQuestionWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { description: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
        { subcategory: { title: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (subcategoryId) {
    andConditions.push({ subcategoryId });
  }

  const whereConditions: Prisma.UserQuestionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [questions, total] = await Promise.all([
    prisma.userQuestion.findMany({
      where: whereConditions,
      select: userQuestionBaseSelect,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.userQuestion.count({
      where: whereConditions,
    }),
  ]);

  const hydratedQuestions = await hydrateUserQuestions(questions);
  const formattedQuestions = hydratedQuestions.map((question) => formatAdminUserQuestion(question));

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: formattedQuestions,
  };
};

const getMyQuestions = async (userId: string, options: IPaginationOptions) => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    prisma.userQuestion.findMany({
      where: { userId },
      select: userQuestionBaseSelect,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.userQuestion.count({
      where: { userId },
    }),
  ]);

  const hydratedQuestions = await hydrateUserQuestions(questions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: hydratedQuestions,
  };
};

const getSingleUserQuestion = async (id: string) => {
  const question = await prisma.userQuestion.findUnique({
    where: { id },
    select: userQuestionBaseSelect,
  });

  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, "User question not found.");
  }

  return hydrateUserQuestion(question);
};

const replyUserQuestion = async (id: string, payload: IReplyUserQuestionInput) => {
  const existingQuestion = await prisma.userQuestion.findUnique({
    where: { id },
    select: userQuestionBaseSelect,
  });

  if (!existingQuestion) {
    throw new ApiError(httpStatus.NOT_FOUND, "User question not found.");
  }

  const hydratedExistingQuestion = await hydrateUserQuestion(existingQuestion);

  const updatedQuestion = await prisma.userQuestion.update({
    where: { id },
    data: {
      adminReply: payload.adminReply,
      status: UserQuestionStatus.ANSWERED,
      repliedAt: new Date(),
    },
    select: userQuestionBaseSelect,
  });

  const hydratedUpdatedQuestion = await hydrateUserQuestion(updatedQuestion);

  // Send answer email notification to the logged-in user who asked the question
  if (hydratedExistingQuestion?.user && hydratedExistingQuestion.user.email) {
    const questionSubcategory = hydratedExistingQuestion.subcategory?.title || "your question";

    const emailHtml = questionAnswerEmail(
      hydratedExistingQuestion.user.name || "User",
      questionSubcategory,
      hydratedExistingQuestion.description,
      payload.adminReply
    );

    try {
      await emailSender(
        `Response to Your Inquiry: ${questionSubcategory}`,
        hydratedExistingQuestion.user.email,
        emailHtml
      );
    } catch {
      // Log email sending error if needed, without breaking DB transaction
    }
  }

  return hydratedUpdatedQuestion;
};

export const UserQuestionService = {
  createUserQuestion,
  getAllUserQuestions,
  getMyQuestions,
  getSingleUserQuestion,
  replyUserQuestion,
};
