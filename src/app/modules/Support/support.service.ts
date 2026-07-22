import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/apiError";
import emailSender from "../../../helpers/email_sender/emailSender";
import prisma from "../../../lib/prisma";
import { adminSupportNotificationEmail } from "../../../shared/emails/adminSupportNotificationEmail";
import {
  ICreateSupportInput,
  IPaginationOptions,
  ISupportFilterRequest,
} from "./support.interface";

const createSupport = async (userId: string, payload: ICreateSupportInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found.");
  }

  const userName = user.name || "User";
  const userEmail = user.email;

  const support = await prisma.support.create({
    data: {
      userId,
      name: userName,
      email: userEmail,
      message: payload.message,
    },
  });

  // Notify admin via email with logged-in user's details
  if (config.emailSender.email) {
    const submittedAt = new Date().toLocaleString();
    const emailHtml = adminSupportNotificationEmail(
      userName,
      userEmail,
      undefined,
      undefined,
      payload.message,
      submittedAt
    );

    try {
      await emailSender(
        `[Support Message] New Support Request from ${userName}`,
        config.emailSender.email,
        emailHtml
      );
    } catch {
      // Log email notification error if any, without breaking support message creation
    }
  }

  return support;
};

const getAllSupportMessages = async (
  filters: ISupportFilterRequest,
  options: IPaginationOptions
) => {
  const { searchTerm } = filters;

  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const andConditions: Prisma.SupportWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { message: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const whereConditions: Prisma.SupportWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [messages, total] = await Promise.all([
    prisma.support.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.support.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: messages,
  };
};

const getSingleSupportMessage = async (id: string) => {
  const message = await prisma.support.findUnique({
    where: { id },
  });

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, "Support message not found.");
  }

  return message;
};

export const SupportService = {
  createSupport,
  getAllSupportMessages,
  getSingleSupportMessage,
};
