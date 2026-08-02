import bcrypt from "bcrypt";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string("Password must be included").min(8, "Password must be at least 8 characters long"),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, body => passwordSchema.safeParse(body));

  if (!body.success) {
    throw createError({
      status: 400,
      statusMessage: "Bad request",
      message: z.prettifyError(body.error),
    });
  }

  const hashed = await bcrypt.hash(body.data.password, 10);

  return { hashed };
});
