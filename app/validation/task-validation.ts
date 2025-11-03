import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(5),
  description: z.string().optional(),
});
