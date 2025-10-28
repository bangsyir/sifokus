import type { DatabaseError } from "~/errors/database-error";

export type Result<T = void> =
  | { success: true; data?: T; error: null }
  | { success: false; data?: null; error: DatabaseError };
