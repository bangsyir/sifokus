import { createContext } from "react-router";
import type { AuthUser } from "./models/user-model";

export const userContext = createContext<AuthUser | null>(null);
