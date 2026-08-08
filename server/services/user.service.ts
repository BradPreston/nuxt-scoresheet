import { auth } from "~~/lib/auth";
import { InsertUser, UpdateUser } from "~~/lib/db/schema/auth";
import env from "~~/lib/env";
import { BadRequestError, NotAllowedError, NotFoundError } from "~~/lib/errors";
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

  if (userData.data.apiKey !== env.X_API_KEY) {
    throw new NotAllowedError("You do not have access to this endpoint");
  }

  const { user } = await userRepository.insertUser(userData.data, event);

  return user;
}

export async function updateUser(event: H3Event<globalThis.EventHandlerRequest>) {
  const params = await getValidatedRouterParams(event, params => schema.safeParse(params));

  if (!params.success) {
    throw new BadRequestError(z.prettifyError(params.error));
  }

  const id = parseInt(params.data.id);

  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw new NotAllowedError("You must be signed in to update this profile");
  }

  // this endpoint is self-service only: the route id must match the signed-in user
  if (Number(session.user.id) !== id) {
    throw new NotAllowedError("You are not allowed to update this user");
  }

  const updatedUserData = await readValidatedBody(event, UpdateUser.safeParse);

  if (!updatedUserData.success) {
    throw new BadRequestError(z.prettifyError(updatedUserData.error));
  }

  const { email, password, currentPassword, name } = updatedUserData.data;

  const updates: Record<string, boolean> = {};

  if (name !== undefined && name !== session.user.name) {
    const { status } = await userRepository.updateUserName(name, event);
    updates.name = status;
  }

  if (email !== undefined && email !== session.user.email) {
    const { status } = await userRepository.updateUserEmail(email, event);
    updates.email = status;
  }

  if (password !== undefined) {
    // currentPassword's presence is already enforced by the UpdateUser schema
    await userRepository.updateUserPassword(password, currentPassword!, event);
    updates.password = true;
  }

  return updates;
}
