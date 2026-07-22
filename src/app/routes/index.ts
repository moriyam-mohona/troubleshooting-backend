import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { CategoryRoutes } from "../modules/Category/category.route";
import { SubcategoryRoutes } from "../modules/Subcategory/subcategory.route";
import { SupportRoutes } from "../modules/Support/support.route";
import { UserRoutes } from "../modules/User/user.route";
import { UserQuestionRoutes } from "../modules/UserQuestion/userQuestion.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/subcategories",
    route: SubcategoryRoutes,
  },
  {
    path: "/user-questions",
    route: UserQuestionRoutes,
  },
  {
    path: "/support",
    route: SupportRoutes,
  },
];

moduleRoutes.forEach((r) => router.use(r.path, r.route));

export default router;
