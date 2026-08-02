import { BadRequestError, NotFoundError } from "~~/lib/errors";
import { z } from "zod";

import type { H3Event } from "#imports";

import userRepository from "../repository/user.repository";

const schema = z.object({
  id: z.string(),
});

export async function getUserById(event: H3Event<globalThis.EventHandlerRequest>) {
  const params = await getValidatedRouterParams(event, params => schema.safeParse(params));

  if (!params.success) {
    throw new BadRequestError(z.prettifyError(params.error));
  }

  const id = parseInt(params.data.id);

  const user = await userRepository.getUserById(id);

  if (!user) {
    throw new NotFoundError(`No user was found with the id "${id}"`);
  }

  return {
    user,
  };
}
