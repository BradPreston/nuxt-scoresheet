import { getUserById } from "~~/server/repository/auth.repository";
import { z } from "zod";

const schema = z.object({
  id: z.string(),
});

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, params => schema.safeParse(params));

  if (!params.success) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: z.prettifyError(params.error),
    });
  }

  const id = parseInt(params.data.id);

  const user = await getUserById(id);

  if (!user) {
    throw createError({
      status: 404,
      statusMessage: "Not found",
      message: `No user was found with the id "${id}"`,
    });
  }

  return {
    user,
  };
});
