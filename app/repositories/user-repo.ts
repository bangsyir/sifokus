import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "~/db/drizzle";
import * as schema from "~/db/schema";

export const userRepo = {
  findByEmail: async (email: string) => {
    const [user] = await db
      .select({
        id: schema.users.id,
        name: schema.users.fullname,
        email: schema.users.email,
        isVerified: schema.users.emailVerified,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.email, email),
          isNotNull(schema.users.emailVerified),
        ),
      );
    return user;
  },
  createUser: async (
    fullname: string,
    username: string,
    email: string,
    emailVerified: Date = new Date(),
    image: string = "",
  ) => {
    const [user] = await db
      .insert(schema.users)
      .values({
        username: username,
        fullname: fullname,
        email: email,
        emailVerified,
        image,
      })
      .returning({
        id: schema.users.id,
        fullname: schema.users.fullname,
        role: schema.users.role,
      });

    return user;
  },

  findByUsername: async (username: string) => {
    const [user] = await db
      .select({
        id: schema.users.id,
        name: schema.users.fullname,
        email: schema.users.email,
        isVerified: schema.users.emailVerified,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.username, username),
          isNotNull(schema.users.emailVerified),
        ),
      );
    return user;
  },
  findUserById: async (id: string) => {
    const [user] = await db
      .select({
        id: schema.users.id,
        fullname: schema.users.fullname,
        email: schema.users.email,
        username: schema.users.username,
      })
      .from(schema.users)
      .where(
        and(eq(schema.users.id, id), isNotNull(schema.users.emailVerified)),
      );
    return user;
  },
  createProvider: async (data: {
    userId: string;
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl: string;
  }) => {
    return await db.insert(schema.userProviders).values(data);
  },
  update: async (data: {
    id: string;
    fullname: string;
    username: string;
    bio?: string;
  }) => {
    return await db
      .update(schema.users)
      .set({ fullname: data.fullname, username: data.username })
      .where(eq(schema.users.id, data.id));
  },

  updateAvatar: async ({ email, url }: { email: string; url: string }) => {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .update(schema.users)
        .set({ image: url })
        .where(eq(schema.users.email, email))
        .returning({ id: schema.users.id });
      console.log(user);
      await tx
        .update(schema.userProviders)
        .set({ avatarUrl: url })
        .where(eq(schema.userProviders.userId, user.id));
    });
  },
};
