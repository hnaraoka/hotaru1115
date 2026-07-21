import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  // next/navigation's redirect() always throws to unwind the render; mimic
  // that so callers can't accidentally fall through past a redirect.
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

beforeEach(() => {
  authMock.mockReset();
  redirectMock.mockClear();
});

describe("requireAdminPageSession", () => {
  it("redirects to /login when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { requireAdminPageSession } = await import("@/lib/requireAdminPage");

    await expect(requireAdminPageSession()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects to / when the session user is not an admin", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "USER" } });
    const { requireAdminPageSession } = await import("@/lib/requireAdminPage");

    await expect(requireAdminPageSession()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("returns the session without redirecting for an admin user", async () => {
    const session = { user: { id: "1", role: "ADMIN" } };
    authMock.mockResolvedValue(session);
    const { requireAdminPageSession } = await import("@/lib/requireAdminPage");

    await expect(requireAdminPageSession()).resolves.toBe(session);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
