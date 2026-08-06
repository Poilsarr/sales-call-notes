import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeAll } from "vitest";
import { TranscriptViewer, type TranscriptViewerHandle } from "@/components/transcript-viewer";

vi.mock("framer-motion", () => {
  const Button = React.forwardRef<HTMLButtonElement, any>(
    ({ children, ...rest }, ref) => (
      <button ref={ref} {...rest}>
        {children}
      </button>
    ),
  );
  Button.displayName = "MockMotionButton";
  const Div = React.forwardRef<HTMLDivElement, any>(({ children, ...rest }, ref) => (
    <div ref={ref} {...rest}>
      {children}
    </div>
  ));
  Div.displayName = "MockMotionDiv";
  return { motion: { button: Button, div: Div } };
});

const segments = [
  { speaker: "A", text: "hello", timestamp: 10 },
  { speaker: "B", text: "world", timestamp: 30 },
  { speaker: "A", text: "bye", timestamp: 60 },
];

function ViewerWithSeekButton({ seconds }: { seconds: number }) {
  const ref = React.useRef<TranscriptViewerHandle>(null);
  return (
    <>
      <TranscriptViewer ref={ref} segments={segments} />
      <button type="button" onClick={() => ref.current?.seekTo(seconds)}>
        seek
      </button>
    </>
  );
}

describe("TranscriptViewer — imperative seekTo", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn() as any;
  });

  it("renders segments with formatted timestamps", () => {
    render(<TranscriptViewer segments={segments} />);
    expect(screen.getByText("0:10")).toBeDefined();
    expect(screen.getByText("0:30")).toBeDefined();
    expect(screen.getByText("1:00")).toBeDefined();
  });

  it("scrolls the nearest segment into view centered", () => {
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    scrollIntoView.mockClear();
    render(<ViewerWithSeekButton seconds={26} />);

    fireEvent.click(screen.getByRole("button", { name: /seek/i }));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    const target = scrollIntoView.mock.instances[0] as HTMLElement;
    expect(target.textContent).toContain("0:30");
  });

  it("no-ops gracefully when no usable timestamps exist", () => {
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    scrollIntoView.mockClear();
    const badSegments = [
      { speaker: "A", text: "hi", timestamp: Number.NaN },
      { speaker: "B", text: "yo", timestamp: Number.NaN },
    ];
    const Nulled = () => {
      const ref = React.useRef<TranscriptViewerHandle>(null);
      return (
        <>
          <TranscriptViewer ref={ref} segments={badSegments as any} />
          <button type="button" onClick={() => ref.current?.seekTo(10)}>
            seek
          </button>
        </>
      );
    };
    render(<Nulled />);

    fireEvent.click(screen.getByRole("button", { name: /seek/i }));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});