import { Prisma, Role, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import { IPaginationOptions, IUpdateProfileInput, IUserFilterRequest } from "./user.interface";

const userSearchableFields = ["name", "email"];

const userSelectFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  isEmailVerified: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

const getAllUsers = async (filters: IUserFilterRequest, options: IPaginationOptions) => {
  const { searchTerm, ...filterData } = filters;

  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const andConditions: Prisma.UserWhereInput[] = [
    {
      role: Role.USER,
    },
  ];

  // Search across searchable fields (name, email)
  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Filter conditions (excluding role)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        const filterKey = key as keyof typeof filterData;
        let value: unknown = filterData[filterKey];

        if (filterKey === "isEmailVerified" && typeof value === "string") {
          value = value === "true";
        }

        return {
          [filterKey]: value,
        };
      }),
    });
  }

  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      select: userSelectFields,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: users,
  };
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  return user;
};

const updateMyProfile = async (userId: string, payload: IUpdateProfileInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
    },
    select: userSelectFields,
  });

  return updatedUser;
};

const toggleUserStatus = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const newStatus =
    existingUser.status === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED;
  const newIsActive = newStatus === UserStatus.ACTIVE;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status: newStatus,
      isActive: newIsActive,
    },
    select: userSelectFields,
  });

  return updatedUser;
};

export const UserService = {
  getAllUsers,
  getSingleUser,
  updateMyProfile,
  toggleUserStatus,
};
