import { InsertUser } from "~~/lib/db/schema/auth";
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

export async function insertUser(event: H3Event<globalThis.EventHandlerRequest>) {
  const userData = await readValidatedBody(event, InsertUser.safeParse);

  if (!userData.success) {
    throw new BadRequestError(z.prettifyError(userData.error));
  }

  const { user } = await userRepository.insertUser(userData.data, event);

  return user;
}
