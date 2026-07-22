import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { SubcategoryController } from "./subcategory.controller";
import { SubcategoryValidation } from "./subcategory.validation";

const router = express.Router();

router.post(
  "/",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(SubcategoryValidation.createSubcategoryZodSchema),
  SubcategoryController.createSubcategory
);

router.get("/category/:categoryId", auth("USER", "SUPER_ADMIN"), SubcategoryController.getSubcategoriesByCategoryId);

router.patch(
  "/:id",
  auth("SUPER_ADMIN"),
  RequestValidation.validateRequest(SubcategoryValidation.updateSubcategoryZodSchema),
  SubcategoryController.updateSubcategory
);

router.delete("/:id", auth("SUPER_ADMIN"), SubcategoryController.deleteSubcategory);

export const SubcategoryRoutes = router;
