import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TrialBanner from "@/components/trial-banner";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("TrialBanner", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders nothing when trialEndsAt is null", () => {
    const { container } = render(<TrialBanner trialEndsAt={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when trialEndsAt is undefined", () => {
    const { container } = render(<TrialBanner trialEndsAt={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when trial is more than 7 days away", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const { container } = render(<TrialBanner trialEndsAt={future.toISOString()} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows amber banner when trial ends in 6 days", () => {
    const future = new Date();
    future.setDate(future.getDate() + 6);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);
    expect(screen.getByText(/6 days/i)).toBeTruthy();
    expect(screen.getByText(/Upgrade now/i)).toBeTruthy();
  });

  it("shows orange banner when trial ends in 2 days", () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);
    expect(screen.getByText(/2 days/i)).toBeTruthy();
  });

  it("shows red banner when trial ends today", () => {
    const today = new Date();
    render(<TrialBanner trialEndsAt={today.toISOString()} />);
    expect(screen.getByText(/0 days/i)).toBeTruthy();
  });

  it("shows singular 'day' when 1 day remaining", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);
    expect(screen.getByText(/1 day/i)).toBeTruthy();
  });

  it("dismisses and saves to localStorage when X is clicked", () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);

    const dismissButton = screen.getByLabelText("Dismiss trial banner");
    fireEvent.click(dismissButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith("trial-banner-dismissed", "true");
    expect(screen.queryByText(/Upgrade now/i)).toBeNull();
  });

  it("respects dismissed state from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("true");
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const { container } = render(<TrialBanner trialEndsAt={future.toISOString()} />);
    expect(container.innerHTML).toBe("");
  });
});
