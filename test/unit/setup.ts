import { vi } from "vitest";

// server/services/user.service.ts relies on Nitro's auto-imported h3 helpers
// (getValidatedRouterParams, readValidatedBody). Those only exist because
// Nitro's build step injects them - outside that build, in this plain-node
// unit project, they're undefined globals. Stub minimal, faithful-enough
// stand-ins so the service functions can run in isolation.
vi.stubGlobal("getValidatedRouterParams", async (event: any, validate: any) =>
  validate(event.context.params));

vi.stubGlobal("readValidatedBody", async (event: any, validate: any) =>
  validate(event.context.body));
