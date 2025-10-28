import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUser = {
  username: string | null | undefined;
  email: string | null | undefined;
  avatarUrl: string | null | undefined;
};

interface AuthUserStoreType {
  authUser: AuthUser | null;
  setAuthUser: (value: AuthUser) => void;
  destroy: () => void;
}

export const useAuthUserStore = create<AuthUserStoreType>()(
  persist(
    (set) => ({
      authUser: null,
      setAuthUser: (value) => {
        set(() => ({
          authUser: { ...value },
        }));
      },
      destroy: () =>
        set({
          authUser: null,
        }),
    }),
    {
      name: "auth-user",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
