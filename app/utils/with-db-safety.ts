// utils/dbErrorHandler.ts

import { DatabaseError } from "~/errors/database-error";

// Map common DB error codes (Postgres, MySQL, SQLite)
const DB_ERROR_MAP: Record<
  string,
  { message: string; status: number; code: string }
> = {
  // Postgres
  "23505": { message: "Duplicate entry", status: 409, code: "DUPLICATE_ENTRY" },
  "23503": {
    message: "Foreign key violation",
    status: 400,
    code: "FK_VIOLATION",
  },
  "22P02": { message: "Invalid data type", status: 400, code: "INVALID_TYPE" },
  ECONNREFUSED: {
    message: "Database unavailable",
    status: 503,
    code: "DB_UNAVAILABLE",
  },
  ETIMEDOUT: { message: "Database timeout", status: 504, code: "DB_TIMEOUT" },
  "28P01": {
    message: "Invalid credentials",
    status: 500,
    code: "DB_AUTH_FAILED",
  },

  // MySQL
  ER_DUP_ENTRY: {
    message: "Duplicate entry",
    status: 409,
    code: "DUPLICATE_ENTRY",
  },
  ER_NO_REFERENCED_ROW: {
    message: "Foreign key violation",
    status: 400,
    code: "FK_VIOLATION",
  },
};

// Generic wrapper
export async function withDbSafety<T>(
  operation: () => Promise<T>,
  context: { action: string; entity?: string },
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const err = error as Error & { code?: string };

    // Log full error (for devs)
    console.error("[DB ERROR]", {
      action: context.action,
      entity: context.entity,
      message: err.message,
      code: err.code,
      stack: err.stack,
    });

    // Map known DB errors
    if (err.code && DB_ERROR_MAP[err.code]) {
      const mapped = DB_ERROR_MAP[err.code];
      throw new DatabaseError(mapped.message, mapped.code, mapped.status);
    }

    // Unknown error → internal
    throw new DatabaseError(
      "Database operation failed",
      "DB_OPERATION_FAILED",
      500,
    );
  }
}
