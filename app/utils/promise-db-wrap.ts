import type { Result } from "~/types/result";
import { withDbSafety } from "./with-db-safety";
import type { DatabaseError } from "~/errors/database-error";
import { db } from "~/db/drizzle";

export const safeDb = async <T = void>(
  operation: () => Promise<T>,
  context: { action: string; entity?: string },
): Promise<Result<T>> => {
  return withDbSafety(async () => {
    const data = await operation();
    return { data, success: true, error: null } satisfies Result<T>;
  }, context).catch((error: DatabaseError) => {
    return { data: null, success: false, error } satisfies Result<T>;
  });
};

export const safeDbTx = async <T = void>(
  operations: (tx: typeof db) => Promise<T>,
  context: { action: string; entity?: string },
): Promise<Result<T>> => {
  return withDbSafety(
    async () => {
      // Pass the transaction object to your function
      const data = await db.transaction((tx: any) => operations(tx));
      return { data, success: true, error: null } satisfies Result<T>;
    },
    { ...context, action: `${context.action} (tx)` },
  ).catch((error) => ({ data: null, success: false, error }));
};
