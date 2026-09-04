import { Response } from "express";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INSUFFICIENT_CREDITS"
  | "PRO_REQUIRED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_QUOTA_EXCEEDED"
  | "AI_AUTH_FAILED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details?: any;

  constructor(message: string, statusCode = 400, code: ErrorCode = "INTERNAL_ERROR", details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, extra: Record<string, any> = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...extra,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code: ErrorCode = "INTERNAL_ERROR",
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    code,
    error: message,
    details: details || undefined,
  });
}
