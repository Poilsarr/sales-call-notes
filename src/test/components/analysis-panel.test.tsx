import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalysisPanel } from "@/components/analysis-panel";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

const baseAnalysis = {
  executiveSummary: "Summary text",
  healthScore: 80,
  actionItems: [{ task: "Send proposal", owner: "Me", priority: "high" }],
  keyDecisions: ["Proceed"],
  nextSteps: [{ step: "Follow up", date: "TBD" }],
};

describe("AnalysisPanel — action item seek chip", () => {
  it("renders a Jump to chip when the item has a timestamp and onSeek is provided", () => {
    const onSeek = vi.fn();
    render(
      <AnalysisPanel
        analysis={{
          ...baseAnalysis,
          actionItems: [
            { task: "Follow up", owner: "Me", priority: "medium", timestamp: 754 },
          ],
        }}
        onSeek={onSeek}
      />,
    );

    const chip = screen.getByRole("button", { name: /jump to 12:34/i });
    expect(chip).toBeDefined();
    fireEvent.click(chip);
    expect(onSeek).toHaveBeenCalledWith(754);
  });

  it("renders no chip when onSeek is missing", () => {
    render(
      <AnalysisPanel
        analysis={{
          ...baseAnalysis,
          actionItems: [
            { task: "Follow up", owner: "Me", priority: "medium", timestamp: 30 },
          ],
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: /jump to/i })).toBeNull();
  });

  it("renders no chip when the item has no timestamp", () => {
    render(<AnalysisPanel analysis={baseAnalysis} onSeek={() => {}} />);

    expect(screen.queryByRole("button", { name: /jump to/i })).toBeNull();
    expect(screen.getByText("Send proposal")).toBeDefined();
  });
});
