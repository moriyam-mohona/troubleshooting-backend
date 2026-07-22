import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = express.Router();

router.post(
  "/",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory
);

router.get("/", auth("USER", "SUPER_ADMIN"), CategoryController.getAllCategories);
router.get("/:id", auth("USER", "SUPER_ADMIN"), CategoryController.getSingleCategory);
router.get("/:id/subcategories", auth("USER", "SUPER_ADMIN"), CategoryController.getSubcategoriesByCategoryId);

router.patch(
  "/:id",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory
);

router.delete("/:id", auth("SUPER_ADMIN"), CategoryController.deleteCategory);

export const CategoryRoutes = router;
