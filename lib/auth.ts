import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import db from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  debug: true,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
});
