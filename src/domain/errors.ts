import type { AppErrorCode, AppErrorPayload } from "./types";

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly recoverable: boolean;
  public readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, recoverable = true, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.recoverable = recoverable;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toPayload(): AppErrorPayload {
    return {
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      details: this.details
    };
  }

  public static from(err: unknown): AppError {
    if (err instanceof AppError) {
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new AppError("UNKNOWN_ERROR", message, true, err);
  }
}
