import { UserQuestionStatus } from "@prisma/client";

export interface ICreateUserQuestionInput {
  subcategoryId: string;
  description: string;
  image?: string;
}

export interface IReplyUserQuestionInput {
  adminReply: string;
}

export interface IUserQuestionFilterRequest {
  searchTerm?: string;
  status?: UserQuestionStatus;
  subcategoryId?: string;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
}
