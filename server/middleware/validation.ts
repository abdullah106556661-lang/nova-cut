import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { sendError } from "../utils/errors";

// Pakistani Phone Format Regex (03001234567, +923001234567, 923001234567)
export const PK_PHONE_REGEX = /^(?:\+92|92|0)?3[0-9]{9}$/;

// Schema: User Signup
export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100, "Name cannot exceed 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Schema: User Login
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

// Schema: Forgot Password Request
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
});

// Schema: Verify Reset Code
export const verifyResetCodeSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  code: z.string().trim().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

// Schema: Complete Password Reset
export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  code: z.string().trim().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Code must be numeric"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Schema: JazzCash Payment Submission
export const paymentSubmitSchema = z.object({
  tid: z
    .string()
    .trim()
    .min(8, "Transaction ID (TID) must be at least 8 characters")
    .max(24, "Transaction ID (TID) cannot exceed 24 characters")
    .regex(/^[A-Za-z0-9]+$/, "Transaction ID must be alphanumeric"),
  senderPhone: z
    .string()
    .trim()
    .regex(PK_PHONE_REGEX, "Sender phone must be a valid Pakistani mobile number (e.g., 03176901963 or +923176901963)"),
  plan: z.enum(["creator", "studio_pro"]).default("studio_pro"),
  amountPkr: z.number().positive().min(500).max(50000).default(1500),
});

// Schema: Project Create / Update
export const projectSaveSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Project title is required").max(120, "Title cannot exceed 120 characters"),
  description: z.string().max(1000).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).default("16:9"),
  resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
  fps: z.number().int().min(15).max(120).default(30),
  duration: z.number().positive().max(3600).default(15),
  tracks: z.array(z.any()).default([]),
  thumbnailUrl: z.string().url().or(z.string().startsWith("data:image/")).optional(),
});

// Schema: AI Image Generation
export const aiImageGenSchema = z.object({
  prompt: z.string().trim().min(2, "Prompt is required").max(2000, "Prompt cannot exceed 2000 characters"),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).default("16:9"),
  numberOfImages: z.number().int().min(1).max(4).default(1),
  style: z.string().max(100).optional(),
});

// Middleware Factory: validate body against any Zod schema
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const errorMsg = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed";
        return sendError(res, errorMsg, 400, "VALIDATION_ERROR", err.issues);
      }
      return sendError(res, "Invalid request payload", 400, "VALIDATION_ERROR");
    }
  };
}
