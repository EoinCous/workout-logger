import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updatePassword: vi.fn(),
  user: { id: "user-1" },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../context/AuthenticationContext", () => ({
  useAuthentication: () => ({
    user: mocks.user,
    updatePassword: mocks.updatePassword,
  }),
}));

import UpdatePassword from "./UpdatePassword";

afterEach(cleanup);

describe("UpdatePassword page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: "user-1" };
    mocks.updatePassword.mockResolvedValue(undefined);
  });

  it("requires the new password and confirmation to match", async () => {
    render(<UpdatePassword />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "first-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect((await screen.findByRole("alert")).textContent).toContain("The passwords do not match.");
    expect(mocks.updatePassword).not.toHaveBeenCalled();
  });

  it("updates the password and offers a way back into the app", async () => {
    render(<UpdatePassword />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(mocks.updatePassword).toHaveBeenCalledWith("new-password");
    expect(await screen.findByRole("heading", { name: "Password updated" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue to RepLog" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });

  it("shows errors returned by Supabase", async () => {
    mocks.updatePassword.mockRejectedValue(new Error("Password is too weak"));
    render(<UpdatePassword />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "weak-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "weak-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Password is too weak");
  });

  it("explains when a reset link has no active recovery session", () => {
    mocks.user = null;
    render(<UpdatePassword />);

    expect(screen.getByRole("alert").textContent)
      .toContain("This password reset link is invalid or has expired.");
    fireEvent.click(screen.getByRole("button", { name: "Return to log in" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });
});
