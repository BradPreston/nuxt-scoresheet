import { fetch, setup } from "@nuxt/test-utils/e2e";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

// This suite drives the app through real HTTP requests against a real Nuxt/
// Nitro dev server, backed by a real (throwaway, file-based) libSQL database
// and the real better-auth instance - nothing about the app under test is
// mocked. It exists to answer a narrower question than the unit/repository
// suites can: does an authenticated PUT /api/users/:id request actually
// persist a change, end to end.
const rootDir = fileURLToPath(new URL("../../", import.meta.url));
const PORT = 3411;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const X_API_KEY = "e2e-test-api-key".repeat(3); // InsertUser requires >= 44 chars

const tempDir = await mkdtemp(join(tmpdir(), "scoresheet-e2e-"));
const dbPath = join(tempDir, "e2e.db");

// Apply the real migrations to a fresh, empty database before the server
// (and better-auth's drizzle adapter) ever touches it.
await migrate(drizzle(`file:${dbPath}`), { migrationsFolder: join(rootDir, "lib/db/migrations") });

// `setup()` must be awaited at module scope (not inside a `beforeAll`) so it
// can register its own beforeAll/afterAll hooks with the test runner during
// collection - nesting it inside our own hook silently no-ops the server.
await setup({
  rootDir,
  dev: true,
  server: true,
  browser: false,
  port: PORT,
  setupTimeout: 120_000,
  env: {
    NODE_ENV: "development", // keeps lib/db from requiring a TURSO_AUTH_TOKEN for the local file db
    TURSO_DATABASE_URL: `file:${dbPath}`,
    TURSO_AUTH_TOKEN: "unused-for-local-file-db",
    X_API_KEY,
    BETTER_AUTH_SECRET: "e2e-test-secret-e2e-test-secret-32-chars",
    BETTER_AUTH_URL: BASE_URL,
  },
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// Better-auth returns the session token as a Set-Cookie header rather than a
// bearer token. $fetch doesn't behave like a browser and won't carry cookies
// between requests on its own, so pull the relevant `name=value` pairs out of
// the sign-in response and forward them explicitly on the follow-up request.
function toCookieHeader(response: Response) {
  return response.headers.getSetCookie()
    .map(cookie => cookie.split(";")[0])
    .join("; ");
}

// eslint-disable-next-line test/prefer-lowercase-title
describe("PUT /api/users/:id (e2e)", () => {
  it("updates and persists a signed-in user's name", async () => {
    const email = `${randomUUID()}@example.com`;
    const password = "supersecret123";

    // 1. Create the user through the app's real signup endpoint.
    const createResponse = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada Lovelace", email, password, apiKey: X_API_KEY }),
    });
    expect(createResponse.status).toBe(200);
    const created = await createResponse.json();
    expect(created.email).toBe(email);

    // 2. Sign in through better-auth's real handler to get a session cookie.
    const signInResponse = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(signInResponse.status).toBe(200);
    const cookie = toCookieHeader(signInResponse);
    expect(cookie).not.toBe("");

    // 3. Update the user's name as that authenticated user.
    const updateResponse = await fetch(`/api/users/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Cookie": cookie },
      body: JSON.stringify({ name: "Ada, Countess of Lovelace" }),
    });
    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toEqual({ name: true });

    // 4. Re-fetch the user and confirm the change actually landed in the DB.
    const getResponse = await fetch(`/api/users/${created.id}`);
    expect(getResponse.status).toBe(200);
    const { user } = await getResponse.json();
    expect(user.name).toBe("Ada, Countess of Lovelace");
  });

  it("rejects an update from an unauthenticated request", async () => {
    const email = `${randomUUID()}@example.com`;

    const createResponse = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Grace Hopper", email, password: "supersecret123", apiKey: X_API_KEY }),
    });
    const created = await createResponse.json();

    const updateResponse = await fetch(`/api/users/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });

    expect(updateResponse.status).toBe(401);
  });
});
