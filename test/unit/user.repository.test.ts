import { beforeEach, describe, expect, it, vi } from "vitest";

import type { H3Event } from "#imports";

vi.mock("~~/lib/db", () => ({
  default: {
    select: vi.fn(),
  },
}));

vi.mock("~~/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      changeEmail: vi.fn(),
      updateUser: vi.fn(),
      changePassword: vi.fn(),
    },
  },
}));

const { auth } = await import("~~/lib/auth");
const { default: db } = await import("~~/lib/db");
const { default: userRepository } = await import("~~/server/repository/user.repository");

function fakeEvent(): H3Event<globalThis.EventHandlerRequest> {
  return { headers: new Headers() } as unknown as H3Event<globalThis.EventHandlerRequest>;
}

// db.select().from(...).where(...) is a chainable, awaitable drizzle query
// builder. Stub just enough of the chain to resolve to the given rows.
function mockSelectResult(rows: unknown[]) {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn(() => ({ where }));
  vi.mocked(db.select).mockReturnValue({ from } as any);
  return { from, where };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserById", () => {
  it("returns the user when a row is found", async () => {
    const user = { id: 1, name: "Ada", email: "ada@example.com" };
    mockSelectResult([user]);

    await expect(userRepository.getUserById(1)).resolves.toEqual(user);
  });

  it("returns undefined when no row is found", async () => {
    mockSelectResult([]);

    await expect(userRepository.getUserById(1)).resolves.toBeUndefined();
  });
});

describe("insertUser", () => {
  it("signs the user up via better-auth and returns the created user + headers", async () => {
    const responseUser = { id: 1, name: "Ada", email: "ada@example.com" };
    const headers = new Headers();
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({
      headers,
      response: { user: responseUser },
    } as any);

    const event = fakeEvent();
    const userData = { name: "Ada", email: "ada@example.com", password: "supersecret", apiKey: "x".repeat(44) };

    await expect(userRepository.insertUser(userData as any, event)).resolves.toEqual({
      headers,
      user: responseUser,
    });
    expect(auth.api.signUpEmail).toHaveBeenCalledWith({
      returnHeaders: true,
      body: userData,
      headers: event.headers,
    });
  });
});

describe("updateUserEmail", () => {
  it("changes the email via better-auth and returns the status + headers", async () => {
    const headers = new Headers();
    vi.mocked(auth.api.changeEmail).mockResolvedValue({
      headers,
      response: { status: true },
    } as any);

    const event = fakeEvent();

    await expect(userRepository.updateUserEmail("new@example.com", event)).resolves.toEqual({
      headers,
      status: true,
    });
    expect(auth.api.changeEmail).toHaveBeenCalledWith({
      returnHeaders: true,
      body: { newEmail: "new@example.com" },
      headers: event.headers,
    });
  });
});

describe("updateUserName", () => {
  it("updates the name via better-auth and returns the status + headers", async () => {
    const headers = new Headers();
    vi.mocked(auth.api.updateUser).mockResolvedValue({
      headers,
      response: { status: true },
    } as any);

    const event = fakeEvent();

    await expect(userRepository.updateUserName("New Name", event)).resolves.toEqual({
      headers,
      status: true,
    });
    expect(auth.api.updateUser).toHaveBeenCalledWith({
      returnHeaders: true,
      body: { name: "New Name" },
      headers: event.headers,
    });
  });
});

describe("updateUserPassword", () => {
  it("changes the password via better-auth and returns the user + headers", async () => {
    const headers = new Headers();
    const responseUser = { id: 1, name: "Ada", email: "ada@example.com" };
    vi.mocked(auth.api.changePassword).mockResolvedValue({
      headers,
      response: { user: responseUser },
    } as any);

    const event = fakeEvent();

    await expect(userRepository.updateUserPassword("newpassword", "oldpassword", event)).resolves.toEqual({
      headers,
      user: responseUser,
    });
    expect(auth.api.changePassword).toHaveBeenCalledWith({
      returnHeaders: true,
      body: { newPassword: "newpassword", currentPassword: "oldpassword" },
      headers: event.headers,
    });
  });
});
