import { Request } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

/**
 * Allowed image types (NO SVG for security)
 */
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/**
 * Secure file filter
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only valid image files are allowed"));
  }
};

/**
 * Multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads/images");

    // Create directory safely
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");

    const uniqueName = `${name}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, uniqueName);
  },
});

/**
 * Multer instance
 */
export const imageUploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

import config from "../../config";

/**
 * Utility to construct full URL for an uploaded file
 */
export const getFullImageUrl = (
  req: Request,
  fileOrPath?: string | Express.Multer.File | null
): string | undefined => {
  if (!fileOrPath) return undefined;

  let relativePath = "";
  if (typeof fileOrPath === "object" && fileOrPath.filename) {
    relativePath = `/uploads/images/${fileOrPath.filename}`;
  } else if (typeof fileOrPath === "string") {
    if (fileOrPath.startsWith("http://") || fileOrPath.startsWith("https://")) {
      return fileOrPath;
    }
    relativePath = fileOrPath.startsWith("/") ? fileOrPath : `/${fileOrPath}`;
  }

  if (!relativePath) return undefined;

  if (config.app.backendUrl && process.env.BACKEND_URL) {
    const baseUrl = config.app.backendUrl.replace(/\/$/, "");
    return `${baseUrl}${relativePath}`;
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host") || `localhost:${config.port}`;

  return `${protocol}://${host}${relativePath}`;
};
