import express from "express";
import auth from "../../middlewares/auth";
import { SubcategoryController } from "./subcategory.controller";

const router = express.Router();

router.get(
  "/category/:categoryId",
  auth("USER", "SUPER_ADMIN"),
  SubcategoryController.getSubcategoriesByCategoryId
);

export const SubcategoryRoutes = router;
