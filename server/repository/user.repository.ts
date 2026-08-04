import type { InsertUserType, SelectUser } from "~~/lib/db/schema/auth";

import { auth } from "~~/lib/auth";
import db from "~~/lib/db";
import { user } from "~~/lib/db/schema/auth";
import { eq } from "drizzle-orm";

import type { H3Event } from "#imports";

export async function getUserById(id: number): Promise<SelectUser | undefined> {
  const [foundUser] = await db.select().from(user).where(eq(user.id, id));
  return foundUser;
}

export async function insertUser(userData: InsertUserType, event: H3Event<globalThis.EventHandlerRequest>) {
  const { headers, response } = await auth.api.signUpEmail({
    returnHeaders: true,
    body: userData,
    headers: event.headers,
  });

  return {
    headers,
    user: response.user,
  };
}

export default {
  getUserById,
  insertUser,
};
