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
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      subcategory: {
        include: { category: true },
      },
    },
  });

  return question;
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
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        subcategory: {
          include: { category: true },
        },
      },
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

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: questions,
  };
};

const getMyQuestions = async (userId: string, options: IPaginationOptions) => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    prisma.userQuestion.findMany({
      where: { userId },
      include: {
        subcategory: {
          include: { category: true },
        },
      },
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

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: questions,
  };
};

const getSingleUserQuestion = async (id: string) => {
  const question = await prisma.userQuestion.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      subcategory: {
        include: { category: true },
      },
    },
  });

  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, "User question not found.");
  }

  return question;
};

const replyUserQuestion = async (id: string, payload: IReplyUserQuestionInput) => {
  const existingQuestion = await prisma.userQuestion.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      subcategory: {
        select: { id: true, title: true },
      },
    },
  });

  if (!existingQuestion) {
    throw new ApiError(httpStatus.NOT_FOUND, "User question not found.");
  }

  const updatedQuestion = await prisma.userQuestion.update({
    where: { id },
    data: {
      adminReply: payload.adminReply,
      status: UserQuestionStatus.ANSWERED,
      repliedAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      subcategory: {
        include: { category: true },
      },
    },
  });

  // Send answer email notification to the logged-in user who asked the question
  if (existingQuestion.user && existingQuestion.user.email) {
    const emailHtml = questionAnswerEmail(
      existingQuestion.user.name || "User",
      existingQuestion.subcategory.title,
      existingQuestion.description,
      payload.adminReply
    );

    try {
      await emailSender(
        `Response to Your Inquiry: ${existingQuestion.subcategory.title}`,
        existingQuestion.user.email,
        emailHtml
      );
    } catch {
      // Log email sending error if needed, without breaking DB transaction
    }
  }

  return updatedQuestion;
};

export const UserQuestionService = {
  createUserQuestion,
  getAllUserQuestions,
  getMyQuestions,
  getSingleUserQuestion,
  replyUserQuestion,
};
