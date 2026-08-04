import { BadRequestError, NotFoundError } from "~~/lib/errors";
import { getUserById } from "~~/server/services/user.service";

export default defineEventHandler(async (event) => {
  try {
    const user = await getUserById(event);
    return user;
  }
  catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw createError({
        status: error.status,
        statusMessage: error.statusMessage,
        message: error.message,
      });
    }

    throw createError({
      status: 400,
      message: "Something went wrong",
    });
  }
});
