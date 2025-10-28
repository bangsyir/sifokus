import { DatabaseError } from "~/errors/database-error";
import type { OauthUser } from "~/models/user-model";
import { userRepo } from "~/repositories";
import { safeDb } from "~/utils/promise-db-wrap";

type Response = {
  success: boolean;
  data?: any;
  error?: any;
};

export const userService = {
  loginWithGoogle: async (data: OauthUser): Promise<Response> => {
    const userExist = await safeDb(
      async () => {
        let user = await userRepo.findByEmail(data.email);
        if (!user)
          throw new DatabaseError("User not found", "USER_NOT_FOUND", 404);
        return user;
      },
      { action: "getUserByEmail", entity: "users" },
    );
    if (userExist.success) {
      const updateAvatar = await safeDb(
        async () =>
          userRepo.updateAvatar({ email: data.email, url: data.avatarUrl }),
        { action: "updateUserAvatar", entity: "users" },
      );
      if (!updateAvatar.success) {
        return { success: false, data: null, error: updateAvatar.error };
      }
      return { success: true, data: userExist.data, error: null };
    }
    const now = new Date();
    const createUser = await safeDb(
      async () =>
        userRepo.createUser(
          data.name,
          data.username,
          data.email,
          now,
          data.avatarUrl,
        ),
      { action: "createUser", entity: "users" },
    );
    if (!createUser.success)
      return { success: false, data: null, error: createUser.error };

    const createProvider = await safeDb(
      async () =>
        await userRepo.createProvider({
          userId: createUser.data?.id!,
          name: data.name,
          email: data.email,
          provider: data.provider,
          providerId: data.providerId,
          avatarUrl: data.avatarUrl,
        }),
      { action: "createProvider", entity: "users" },
    );
    if (!createProvider.success)
      return { success: false, data: null, error: createProvider.error };
    return { success: true, data: createUser.data, error: null };
  },
};
