import type { SelectUser } from "~~/lib/db/schema/auth";

import db from "~~/lib/db";
import { user } from "~~/lib/db/schema/auth";
import { eq } from "drizzle-orm";

export async function getUserById(id: number): Promise<SelectUser | undefined> {
  const [foundUser] = await db.select().from(user).where(eq(user.id, id));
  return foundUser;
}

export default {
  getUserById,
};
