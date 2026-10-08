import { beforeEach, vi } from "vitest";
import { testRequest } from "./next-request";

// next/headers and next/cache only work inside a Next.js request. Tests
// supply the request headers themselves and skip cache revalidation.
vi.mock("next/headers", () => ({
  headers: async () => testRequest.headers,
  cookies: async () => ({ set() {} }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  testRequest.headers = new Headers();
});
