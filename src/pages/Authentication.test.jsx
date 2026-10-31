import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  login: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  setCurrentPlan: vi.fn(),
  setWorkouts: vi.fn(),
  setWeeklyGoal: vi.fn(),
  setTemplates: vi.fn(),
  fetchCurrentPlan: vi.fn(),
  fetchWeeklyGoal: vi.fn(),
  fetchWorkouts: vi.fn(),
  fetchTemplates: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../context/AuthenticationContext", () => ({
  useAuthentication: () => ({
    login: mocks.login,
    signUp: mocks.signUp,
    resetPassword: mocks.resetPassword,
  }),
}));

vi.mock("../context/WorkoutContext", () => ({
  useWorkout: () => ({
    setCurrentPlan: mocks.setCurrentPlan,
    setWorkouts: mocks.setWorkouts,
    setWeeklyGoal: mocks.setWeeklyGoal,
    setTemplates: mocks.setTemplates,
  }),
}));

vi.mock("../supabase/supabaseWorkoutService", () => ({
  fetchCurrentPlan: mocks.fetchCurrentPlan,
  fetchWeeklyGoal: mocks.fetchWeeklyGoal,
  fetchWorkouts: mocks.fetchWorkouts,
  fetchTemplates: mocks.fetchTemplates,
}));

import Authentication from "./Authentication";

afterEach(cleanup);

describe("Authentication page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockResolvedValue({ user: { id: "user-1" } });
    mocks.signUp.mockResolvedValue(undefined);
    mocks.resetPassword.mockResolvedValue(undefined);
    mocks.fetchCurrentPlan.mockResolvedValue(null);
    mocks.fetchWeeklyGoal.mockResolvedValue(null);
    mocks.fetchWorkouts.mockResolvedValue([]);
    mocks.fetchTemplates.mockResolvedValue([]);
  });

  it("loads the user's workout data before navigating after login", async () => {
    render(<Authentication />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "  user@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/");
    });
    expect(mocks.login).toHaveBeenCalledWith("user@example.com", "password");
    expect(mocks.fetchWorkouts).toHaveBeenCalledWith("user-1");
    expect(mocks.fetchCurrentPlan).toHaveBeenCalledWith("user-1");
    expect(mocks.fetchWeeklyGoal).toHaveBeenCalledWith("user-1");
    expect(mocks.fetchTemplates).toHaveBeenCalledWith("user-1");
    expect(mocks.setWorkouts).toHaveBeenCalledWith([]);
    expect(mocks.setCurrentPlan).toHaveBeenCalledWith(null);
    expect(mocks.setWeeklyGoal).toHaveBeenCalledWith(null);
    expect(mocks.setTemplates).toHaveBeenCalledWith([]);
  });

  it("shows a useful login error and keeps the user on the page", async () => {
    mocks.login.mockRejectedValue(new Error("Invalid login credentials"));
    render(<Authentication />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect((await screen.findByRole("alert")).textContent)
      .toContain("Email or password is incorrect. Please try again.");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("requests a password reset for the trimmed email and shows privacy-safe feedback", async () => {
    render(<Authentication />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "  user@example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect((await screen.findByRole("status")).textContent)
      .toContain("If an account exists for this email, we'll send a password reset link.");
    expect(mocks.resetPassword).toHaveBeenCalledWith("user@example.com");
  });

  it("shows password reset request errors", async () => {
    mocks.resetPassword.mockRejectedValue(new Error("Email service unavailable"));
    render(<Authentication />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect((await screen.findByRole("alert")).textContent)
      .toContain("Email service unavailable");
  });

  it("shows conditional signup guidance instead of claiming an email was sent", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<Authentication />);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByRole("heading", { name: "Get started" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect((await screen.findByRole("status")).textContent)
      .toContain("If an account can be created with this email, a confirmation link will arrive in your inbox.");
    expect(screen.getByRole("status").textContent).not.toContain("We sent");
    expect(mocks.signUp).toHaveBeenCalledWith("new@example.com", "password");
    expect(alert).not.toHaveBeenCalled();
  });

  it("does not claim to send a confirmation email when Supabase hides an existing account", async () => {
    mocks.signUp.mockResolvedValue({
      user: { identities: [] },
      session: null,
    });
    render(<Authentication />);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    const message = await screen.findByRole("status");
    expect(message.textContent).toContain("If you already have an account, log in instead.");
    expect(message.textContent).not.toContain("We sent");
  });

  it("clears submission feedback when switching authentication modes", async () => {
    mocks.login.mockRejectedValue(new Error("Invalid login credentials"));
    render(<Authentication />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByLabelText("Password").value).toBe("");
    });
  });
});
