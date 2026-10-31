import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import { supabase } from "../supabase/supabaseClient";
import {
  AuthenticationProvider,
  useAuthentication,
} from "./AuthenticationContext";

let authStateChangeHandler;
let subscription;

const wrapper = ({ children }) => (
  <AuthenticationProvider>{children}</AuthenticationProvider>
);

describe("AuthenticationContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeHandler = null;
    subscription = { unsubscribe: vi.fn() };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    supabase.auth.onAuthStateChange.mockImplementation((handler) => {
      authStateChangeHandler = handler;
      return { data: { subscription } };
    });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    supabase.auth.signUp.mockResolvedValue({ error: null });
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: "session-data" },
      error: null,
    });
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    supabase.auth.updateUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  it("restores the user from a valid session", async () => {
    const user = { id: "restored-user" };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user, expires_at: Math.floor(Date.now() / 1000) + 3600 } },
      error: null,
    });

    const { result } = renderHook(() => useAuthentication(), { wrapper });

    await waitFor(() => {
      expect(result.current.authenticationLoading).toBe(false);
    });
    expect(result.current.user).toBe(user);
  });

  it("does not overwrite a newer auth event with the initial session result", async () => {
    let resolveSession;
    supabase.auth.getSession.mockReturnValue(new Promise((resolve) => {
      resolveSession = resolve;
    }));

    const { result } = renderHook(() => useAuthentication(), { wrapper });
    const newerUser = { id: "newer-user" };

    act(() => {
      authStateChangeHandler("SIGNED_IN", { user: newerUser });
    });
    await act(async () => {
      resolveSession({
        data: {
          session: {
            user: { id: "stale-user" },
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      });
    });

    await waitFor(() => {
      expect(result.current.authenticationLoading).toBe(false);
    });
    expect(result.current.user).toBe(newerUser);
  });

  it("clears an expired session by signing out", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "expired-user" }, expires_at: 0 } },
      error: null,
    });

    const { result } = renderHook(() => useAuthentication(), { wrapper });

    await waitFor(() => {
      expect(result.current.authenticationLoading).toBe(false);
    });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(result.current.user).toBeNull();
  });

  it("reports failure to clear an expired session", async () => {
    const error = new Error("Sign-out failed");
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "expired-user" }, expires_at: 0 } },
      error: null,
    });
    supabase.auth.signOut.mockResolvedValue({ error });

    const { result } = renderHook(() => useAuthentication(), { wrapper });

    await waitFor(() => {
      expect(result.current.authenticationLoading).toBe(false);
    });
    expect(logError).toHaveBeenCalledWith("Failed to get initial session:", error);
    expect(result.current.user).toBeNull();
  });

  it("updates the user on auth state changes and unsubscribes on unmount", async () => {
    const { result, unmount } = renderHook(() => useAuthentication(), { wrapper });
    const user = { id: "signed-in-user" };

    await waitFor(() => {
      expect(result.current.authenticationLoading).toBe(false);
    });
    act(() => {
      authStateChangeHandler("SIGNED_IN", { user });
    });
    expect(result.current.user).toBe(user);

    act(() => {
      authStateChangeHandler("SIGNED_OUT", null);
    });
    expect(result.current.user).toBeNull();

    unmount();
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it("forwards auth action errors without logging them", async () => {
    const error = new Error("Authentication failed");
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    supabase.auth.signUp.mockResolvedValue({ error });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error });
    supabase.auth.signOut.mockResolvedValue({ error });

    const { result } = renderHook(() => useAuthentication(), { wrapper });

    await expect(result.current.signUp("user@example.com", "password"))
      .rejects.toBe(error);
    await expect(result.current.login("user@example.com", "password"))
      .rejects.toBe(error);
    await expect(result.current.logout()).rejects.toBe(error);
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(logError).not.toHaveBeenCalled();
  });

  it("requests password reset with the update-password redirect", async () => {
    const { result } = renderHook(() => useAuthentication(), { wrapper });

    await expect(result.current.resetPassword("user@example.com")).resolves.toBeUndefined();
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: `${window.location.origin}/update-password`,
    });
  });

  it("updates the password and propagates Supabase errors", async () => {
    const { result } = renderHook(() => useAuthentication(), { wrapper });

    await expect(result.current.updatePassword("new-password"))
      .resolves.toEqual({ user: { id: "user-1" } });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });

    const error = new Error("Update failed");
    supabase.auth.updateUser.mockResolvedValue({ data: null, error });
    await expect(result.current.updatePassword("new-password")).rejects.toBe(error);
  });

  it("treats a missing session during logout as already signed out", async () => {
    const user = { id: "signed-in-user" };
    const missingSessionError = Object.assign(new Error("Auth session missing!"), {
      name: "AuthSessionMissingError",
    });
    supabase.auth.signOut.mockResolvedValue({ error: missingSessionError });
    const { result } = renderHook(() => useAuthentication(), { wrapper });

    act(() => {
      authStateChangeHandler("SIGNED_IN", { user });
    });
    expect(result.current.user).toBe(user);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("returns login data and rejects use outside the provider", async () => {
    const loginData = { user: { id: "signed-in-user" } };
    supabase.auth.signInWithPassword.mockResolvedValue({ data: loginData, error: null });

    const { result } = renderHook(() => useAuthentication(), { wrapper });
    await expect(result.current.login("user@example.com", "password")).resolves.toBe(loginData);

    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuthentication())).toThrow(
      "useAuthentication must be used within an AuthenticationProvider"
    );
    logError.mockRestore();
  });
});
