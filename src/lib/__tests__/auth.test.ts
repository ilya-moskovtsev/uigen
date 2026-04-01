import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();
const mockCookies = vi.fn().mockResolvedValue({
  set: mockCookieSet,
  get: mockCookieGet,
  delete: mockCookieDelete,
});
vi.mock("next/headers", () => ({ cookies: mockCookies }));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function signToken(payload: object, expirationTime = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.path).toBe("/");
  expect(options.sameSite).toBe("lax");
});

test("createSession stores a valid JWT with correct payload", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-42", "test@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets cookie expiry ~7 days from now", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const [, , options] = mockCookieSet.mock.calls[0];
  const expires: Date = options.expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession sets secure=true in production", async () => {
  process.env.NODE_ENV = "production";
  vi.resetModules();
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(true);
  process.env.NODE_ENV = "test";
});

// getSession

test("getSession returns null when no cookie is present", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await signToken({ userId: "user-1", email: "user@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("user@example.com");
});

test("getSession returns null for a malformed token", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieGet.mockReturnValue({ value: "not-a-valid-jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const { getSession } = await import("@/lib/auth");
  const expiredAt = Math.floor(Date.now() / 1000) - 1;
  const token = await new SignJWT({ userId: "user-1", email: "user@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiredAt)
    .sign(JWT_SECRET);
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

// createSession — secure flag

test("createSession sets secure=false outside production", async () => {
  process.env.NODE_ENV = "test";
  vi.resetModules();
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

// deleteSession

test("deleteSession deletes the auth-token cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");
  await deleteSession();

  expect(mockCookieDelete).toHaveBeenCalledOnce();
  expect(mockCookieDelete).toHaveBeenCalledWith("auth-token");
});
