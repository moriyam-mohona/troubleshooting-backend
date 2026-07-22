import { UserStatus } from "@prisma/client";

export interface IUserFilterRequest {
  searchTerm?: string;
  status?: UserStatus;
  isEmailVerified?: boolean | string;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
}

export interface IUpdateProfileInput {
  name?: string;
}
