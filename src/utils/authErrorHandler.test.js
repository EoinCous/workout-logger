import { describe, expect, it, vi } from "vitest";
import { handleSupabaseAuthError } from "./authErrorHandler";

describe("handleSupabaseAuthError", () => {
  it("returns false and does not log out when there is no error", () => {
    const logout = vi.fn();

    expect(handleSupabaseAuthError(null, logout)).toBe(false);
    expect(handleSupabaseAuthError(undefined, logout)).toBe(false);
    expect(logout).not.toHaveBeenCalled();
  });

  it.each([
    ["401 status", { status: 401 }],
    ["row-level security message", { message: "Blocked by row-level security policy" }],
    ["not authenticated message", { message: "User is not authenticated" }],
    ["case-insensitive auth message", { message: "NOT AUTHENTICATED" }],
  ])("logs out for an authentication failure: %s", async (_description, error) => {
    const logout = vi.fn().mockResolvedValue(undefined);

    handleSupabaseAuthError(error, logout);

    expect(logout).toHaveBeenCalledOnce();
    await Promise.resolve();
  });

  it("does not log out for unrelated errors", () => {
    const logout = vi.fn();

    expect(handleSupabaseAuthError({ status: 500, message: "Server error" }, logout)).toBeUndefined();
    expect(logout).not.toHaveBeenCalled();
  });

  it("does not leak rejected logout promises", async () => {
    const logout = vi.fn().mockRejectedValue(new Error("Logout failed"));

    expect(() => handleSupabaseAuthError({ status: 401 }, logout)).not.toThrow();
    await Promise.resolve();
    expect(logout).toHaveBeenCalledOnce();
  });
});
