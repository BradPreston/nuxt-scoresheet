import { BadRequestError, NotAllowedError } from "~~/lib/errors";
import { updateUser } from "~~/server/services/user.service";

export default defineEventHandler(async (event) => {
  try {
    const user = await updateUser(event);
    return user;
  }
  catch (error) {
    if (error instanceof BadRequestError || error instanceof NotAllowedError) {
      throw createError({
        status: error.status,
        statusMessage: error.statusMessage,
        message: error.message,
      });
    }

    throw createError({
      status: 400,
      statusMessage: "Unknown",
      message: "Something went wrong",
    });
  }
});
