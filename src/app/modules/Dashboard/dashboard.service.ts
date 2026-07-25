import { Role } from "@prisma/client";
import prisma from "../../../lib/prisma";

type PeriodRange = {
  start: Date;
  end: Date;
};

type RecentActivityItem = {
  id: string;
  type: "USER_JOINED" | "USER_QUESTION_SUBMITTED" | "SUPPORT_MESSAGE_CREATED";
  title: string;
  subtitle: string;
  createdAt: Date;
  timeAgo: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  subcategory: {
    id: string;
    title: string;
    category: {
      id: string;
      title: string;
    } | null;
  } | null;
  supportMessage?: {
    id: string;
    subject: string | null;
    message: string;
  } | null;
};

type RecentActivityQuery = {
  cursor?: string;
  limit?: string | number;
};

type RecentActivityCursor = {
  createdAt: string;
  id: string;
};

const getUtcStartOfMonth = (date: Date) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

const getUtcStartOfWeek = (date: Date) => {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = current.getUTCDay();
  const daysSinceStartOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  current.setUTCDate(current.getUTCDate() - daysSinceStartOfWeek);
  current.setUTCHours(0, 0, 0, 0);

  return current;
};

const getPreviousPeriodRange = (start: Date, end: Date) => {
  const duration = end.getTime() - start.getTime();

  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1),
  } satisfies PeriodRange;
};

const getCountStats = async (actions: {
  total: () => Promise<number>;
  current: () => Promise<number>;
  previous: () => Promise<number>;
}) => {
  const [total, currentPeriodCount, previousPeriodCount] = await Promise.all([
    actions.total(),
    actions.current(),
    actions.previous(),
  ]);

  return {
    total,
    currentPeriodCount,
    previousPeriodCount,
    difference: currentPeriodCount - previousPeriodCount,
  };
};

const getTimeAgo = (date: Date, now = new Date()) => {
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const encodeRecentActivityCursor = (cursor: RecentActivityCursor) => {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64");
};

const decodeRecentActivityCursor = (cursor?: string): RecentActivityCursor | null => {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64").toString("utf8")
    ) as Partial<RecentActivityCursor>;

    if (typeof decoded.createdAt !== "string" || typeof decoded.id !== "string") {
      return null;
    }

    return {
      createdAt: decoded.createdAt,
      id: decoded.id,
    };
  } catch {
    return null;
  }
};

const getCursorWhereClause = (cursor: RecentActivityCursor | null) => {
  if (!cursor) {
    return undefined;
  }

  const createdAt = new Date(cursor.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return undefined;
  }

  return {
    OR: [
      {
        createdAt: {
          lt: createdAt,
        },
      },
      {
        createdAt,
        id: {
          lt: cursor.id,
        },
      },
    ],
  };
};

const mergeRecentActivities = (activities: RecentActivityItem[]) => {
  return [...activities].sort((left, right) => {
    const dateDiff = right.createdAt.getTime() - left.createdAt.getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return right.id.localeCompare(left.id);
  });
};

const getRecentActivities = async (query: RecentActivityQuery) => {
  const limitValue = Number(query.limit ?? 3);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 20) : 3;
  const decodedCursor = decodeRecentActivityCursor(query.cursor?.trim());
  const cursorWhere = getCursorWhereClause(decodedCursor);

  const [usersCreated, questionsCreated, supportMessagesCreated] = await Promise.all([
    prisma.user.findMany({
      where: cursorWhere ? { ...cursorWhere, role: Role.USER } : { role: Role.USER },
      take: limit + 1,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.userQuestion.findMany({
      ...(cursorWhere ? { where: cursorWhere } : {}),
      take: limit + 1,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      select: {
        id: true,
        userId: true,
        subcategoryId: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.support.findMany({
      ...(cursorWhere ? { where: cursorWhere } : {}),
      take: limit + 1,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        subject: true,
        message: true,
        createdAt: true,
      },
    }),
  ]);

  const userQuestionIds = [...new Set(questionsCreated.map((item) => item.userId))];
  const questionSubcategoryIds = [...new Set(questionsCreated.map((item) => item.subcategoryId))];
  const supportUserIds = [
    ...new Set(supportMessagesCreated.map((item) => item.userId).filter(Boolean)),
  ] as string[];

  const [questionUsers, subcategories, supportUsers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userQuestionIds } },
      select: { id: true, name: true, email: true },
    }),
    prisma.subCategory.findMany({
      where: { id: { in: questionSubcategoryIds } },
      select: {
        id: true,
        title: true,
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { id: { in: supportUserIds } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const questionUserMap = new Map(questionUsers.map((user) => [user.id, user]));
  const subcategoryMap = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory]));
  const supportUserMap = new Map(supportUsers.map((user) => [user.id, user]));

  const activities: RecentActivityItem[] = [
    ...usersCreated.map((user) => ({
      id: user.id,
      type: "USER_JOINED" as const,
      title: `${user.name || user.email} joined the platform`,
      subtitle: user.email,
      createdAt: user.createdAt,
      timeAgo: getTimeAgo(user.createdAt),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      subcategory: null,
      supportMessage: null,
    })),
    ...questionsCreated.map((item) => {
      const user = questionUserMap.get(item.userId) ?? null;
      const subcategory = subcategoryMap.get(item.subcategoryId) ?? null;
      const userName = user?.name || user?.email || "Unknown user";
      const subcategoryTitle = subcategory?.title || "deleted subcategory";

      return {
        id: item.id,
        type: "USER_QUESTION_SUBMITTED" as const,
        title: `New question submitted by ${userName} on '${subcategoryTitle}'`,
        subtitle: "User asked a new question.",
        createdAt: item.createdAt,
        timeAgo: getTimeAgo(item.createdAt),
        user,
        subcategory,
        supportMessage: null,
      };
    }),
    ...supportMessagesCreated.map((item) => {
      const linkedUser = item.userId ? (supportUserMap.get(item.userId) ?? null) : null;
      const displayName = item.name || linkedUser?.name || linkedUser?.email || "Unknown user";
      const supportSubject = item.subject || "support message";

      return {
        id: item.id,
        type: "SUPPORT_MESSAGE_CREATED" as const,
        title: `New support message from ${displayName}`,
        subtitle: supportSubject,
        createdAt: item.createdAt,
        timeAgo: getTimeAgo(item.createdAt),
        user: linkedUser,
        subcategory: null,
        supportMessage: {
          id: item.id,
          subject: item.subject,
          message: item.message,
        },
      };
    }),
  ];

  const mergedActivities = mergeRecentActivities(activities);
  const pageItems = mergedActivities.slice(0, limit);
  const hasNextPage = mergedActivities.length > limit;

  if (pageItems.length === 0) {
    return {
      meta: {
        limit,
        nextCursor: null,
        hasNextPage: false,
      },
      data: [],
    };
  }
  const nextCursorItem = pageItems[pageItems.length - 1];

  return {
    meta: {
      limit,
      nextCursor: hasNextPage
        ? encodeRecentActivityCursor({
            createdAt: nextCursorItem.createdAt.toISOString(),
            id: nextCursorItem.id,
          })
        : null,
      hasNextPage,
    },
    data: pageItems,
  };
};

const getDashboardSummary = async () => {
  const now = new Date();

  const currentMonthStart = getUtcStartOfMonth(now);
  const previousMonthRange = getPreviousPeriodRange(currentMonthStart, now);

  const currentWeekStart = getUtcStartOfWeek(now);
  const previousWeekRange = getPreviousPeriodRange(currentWeekStart, now);

  const [categoryStats, subcategoryStats, userQuestionStats, userStats] = await Promise.all([
    getCountStats({
      total: () => prisma.category.count(),
      current: () =>
        prisma.category.count({
          where: {
            createdAt: {
              gte: currentMonthStart,
              lte: now,
            },
          },
        }),
      previous: () =>
        prisma.category.count({
          where: {
            createdAt: {
              gte: previousMonthRange.start,
              lte: previousMonthRange.end,
            },
          },
        }),
    }),
    getCountStats({
      total: () => prisma.subCategory.count(),
      current: () =>
        prisma.subCategory.count({
          where: {
            createdAt: {
              gte: currentMonthStart,
              lte: now,
            },
          },
        }),
      previous: () =>
        prisma.subCategory.count({
          where: {
            createdAt: {
              gte: previousMonthRange.start,
              lte: previousMonthRange.end,
            },
          },
        }),
    }),
    getCountStats({
      total: () => prisma.userQuestion.count(),
      current: () =>
        prisma.userQuestion.count({
          where: {
            createdAt: {
              gte: currentWeekStart,
              lte: now,
            },
          },
        }),
      previous: () =>
        prisma.userQuestion.count({
          where: {
            createdAt: {
              gte: previousWeekRange.start,
              lte: previousWeekRange.end,
            },
          },
        }),
    }),
    getCountStats({
      total: () => prisma.user.count({ where: { role: Role.USER } }),
      current: () =>
        prisma.user.count({
          where: {
            role: Role.USER,
            createdAt: {
              gte: currentWeekStart,
              lte: now,
            },
          },
        }),
      previous: () =>
        prisma.user.count({
          where: {
            role: Role.USER,
            createdAt: {
              gte: previousWeekRange.start,
              lte: previousWeekRange.end,
            },
          },
        }),
    }),
  ]);

  return {
    categories: {
      total: categoryStats.total,
      currentMonthCount: categoryStats.currentPeriodCount,
      previousMonthCount: categoryStats.previousPeriodCount,
      difference: categoryStats.difference,
      label: "vs last month",
    },
    subcategories: {
      total: subcategoryStats.total,
      currentMonthCount: subcategoryStats.currentPeriodCount,
      previousMonthCount: subcategoryStats.previousPeriodCount,
      difference: subcategoryStats.difference,
      label: "vs last month",
    },
    userQueries: {
      total: userQuestionStats.total,
      thisWeekCount: userQuestionStats.currentPeriodCount,
      lastWeekCount: userQuestionStats.previousPeriodCount,
      difference: userQuestionStats.difference,
      label: "this week",
    },
    users: {
      total: userStats.total,
      thisWeekCount: userStats.currentPeriodCount,
      lastWeekCount: userStats.previousPeriodCount,
      difference: userStats.difference,
      label: "this week",
    },
  };
};

export const DashboardService = {
  getDashboardSummary,
  getRecentActivities,
};
