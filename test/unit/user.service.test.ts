import { BadRequestError, NotAllowedError, NotFoundError } from "~~/lib/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { H3Event } from "#imports";

const TEST_API_KEY = "a".repeat(44);

vi.mock("~~/lib/env", () => ({
  default: {
    NODE_ENV: "test",
    TURSO_DATABASE_URL: "libsql://test",
    TURSO_AUTH_TOKEN: "test-token",
    X_API_KEY: TEST_API_KEY,
  },
}));

vi.mock("~~/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("~~/server/repository/user.repository", () => ({
  default: {
    getUserById: vi.fn(),
    insertUser: vi.fn(),
    updateUserName: vi.fn(),
    updateUserEmail: vi.fn(),
    updateUserPassword: vi.fn(),
  },
}));

const { auth } = await import("~~/lib/auth");
const { default: userRepository } = await import("~~/server/repository/user.repository");
const { getUserById, insertUser, updateUser } = await import("~~/server/services/user.service");

function fakeEvent(params: Record<string, unknown>, body: unknown = {}): H3Event<globalThis.EventHandlerRequest> {
  return {
    context: { params, body },
    headers: new Headers(),
  } as unknown as H3Event<globalThis.EventHandlerRequest>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserById", () => {
  it("throws BadRequestError when the id param is missing", async () => {
    await expect(getUserById(fakeEvent({}))).rejects.toThrow(BadRequestError);
  });

  it("throws NotFoundError when no user exists for the id", async () => {
    vi.mocked(userRepository.getUserById).mockResolvedValue(undefined);

    await expect(getUserById(fakeEvent({ id: "1" }))).rejects.toThrow(NotFoundError);
  });

  it("returns the user when found", async () => {
    const user = { id: 1, name: "Ada", email: "ada@example.com" };
    vi.mocked(userRepository.getUserById).mockResolvedValue(user as any);

    await expect(getUserById(fakeEvent({ id: "1" }))).resolves.toEqual({ user });
    expect(userRepository.getUserById).toHaveBeenCalledWith(1);
  });
});

describe("insertUser", () => {
  const validBody = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "supersecret",
    apiKey: TEST_API_KEY,
  };

  it("throws BadRequestError when the body fails validation", async () => {
    await expect(insertUser(fakeEvent({}, { ...validBody, email: "not-an-email" })))
      .rejects
      .toThrow(BadRequestError);
    expect(userRepository.insertUser).not.toHaveBeenCalled();
  });

  it("throws NotAllowedError when the apiKey doesn't match the server's", async () => {
    await expect(insertUser(fakeEvent({}, { ...validBody, apiKey: "b".repeat(44) })))
      .rejects
      .toThrow(NotAllowedError);
    expect(userRepository.insertUser).not.toHaveBeenCalled();
  });

  it("inserts and returns the user on valid input", async () => {
    const user = { id: 1, name: validBody.name, email: validBody.email };
    vi.mocked(userRepository.insertUser).mockResolvedValue({ user } as any);

    await expect(insertUser(fakeEvent({}, validBody))).resolves.toEqual(user);
    expect(userRepository.insertUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: validBody.email }),
      expect.anything(),
    );
  });
});

describe("updateUser", () => {
  const session = { user: { id: "1", name: "Ada", email: "ada@example.com" } };

  it("throws BadRequestError when the id param is missing", async () => {
    await expect(updateUser(fakeEvent({}, { name: "New Name" }))).rejects.toThrow(BadRequestError);
  });

  it("throws NotAllowedError when there is no session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

    await expect(updateUser(fakeEvent({ id: "1" }, { name: "New Name" }))).rejects.toThrow(NotAllowedError);
  });

  it("throws NotAllowedError when the route id doesn't match the signed-in user", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any);

    await expect(updateUser(fakeEvent({ id: "2" }, { name: "New Name" }))).rejects.toThrow(NotAllowedError);
  });

  it("throws BadRequestError when the body fails validation (e.g. empty payload)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any);

    await expect(updateUser(fakeEvent({ id: "1" }, {}))).rejects.toThrow(BadRequestError);
  });

  it("throws BadRequestError when password is provided without currentPassword", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any);

    await expect(updateUser(fakeEvent({ id: "1" }, { password: "newpassword" })))
      .rejects
      .toThrow(BadRequestError);
  });

  it("only updates fields that actually changed, and skips the rest", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any);
    vi.mocked(userRepository.updateUserName).mockResolvedValue({ status: true } as any);

    const result = await updateUser(fakeEvent({ id: "1" }, { name: "New Name", email: session.user.email }));

    expect(userRepository.updateUserName).toHaveBeenCalledWith("New Name", expect.anything());
    expect(userRepository.updateUserEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ name: true });
  });

  it("updates the password when currentPassword is also provided", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any);
    vi.mocked(userRepository.updateUserPassword).mockResolvedValue({ user: {} } as any);

    const result = await updateUser(fakeEvent({ id: "1" }, {
      password: "newpassword",
      currentPassword: "oldpassword",
    }));

    expect(userRepository.updateUserPassword).toHaveBeenCalledWith("newpassword", "oldpassword", expect.anything());
    expect(result).toEqual({ password: true });
  });
});
