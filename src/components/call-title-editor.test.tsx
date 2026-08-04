import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { CallTitleEditor } from "@/components/call-title-editor";

function renderEditor(options?: {
  displayName?: string;
  onSave?: (title: string | null) => Promise<boolean>;
  disabled?: boolean;
}) {
  const onSave = options?.onSave ?? vi.fn(async () => true);
  render(
    createElement(CallTitleEditor, {
      displayName: options?.displayName ?? "Recording 2026-08-01.wav",
      onSave,
      disabled: options?.disabled,
    }),
  );
  return { onSave };
}

async function openEditor(): Promise<HTMLElement> {
  fireEvent.click(screen.getByRole("button", { name: "Rename call" }));
  return screen.getByRole("textbox", { name: "Call title" });
}

describe("CallTitleEditor", () => {
  it("renders the rename pencil with the correct accessible label", () => {
    renderEditor();

    expect(screen.getByRole("button", { name: "Rename call" })).toBeInTheDocument();
  });

  it("clicking the pencil prevents default, stops propagation, and enters edit mode", () => {
    renderEditor();

    const pencil = screen.getByRole("button", { name: "Rename call" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, "preventDefault");
    const stopPropagation = vi.spyOn(event, "stopPropagation");

    fireEvent(pencil, event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Call title" })).toBeInTheDocument();
  });

  it("does not save when Enter is pressed while composing", async () => {
    const { onSave } = renderEditor();
    const input = await openEditor();
    fireEvent.change(input, { target: { value: "Quarterly review" } });

    fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Call title" })).toBeInTheDocument();
  });

  it("saves when Enter is pressed after composition ends", async () => {
    const { onSave } = renderEditor();
    const input = await openEditor();
    fireEvent.change(input, { target: { value: "Quarterly review" } });

    fireEvent.keyDown(input, { key: "Enter", isComposing: false });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("Quarterly review");
    });
  });

  it("pressing Escape closes the editor without saving", async () => {
    const { onSave } = renderEditor();
    const input = await openEditor();
    fireEvent.change(input, { target: { value: "Should not be saved" } });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("textbox", { name: "Call title" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename call" })).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("closes the editor when onSave resolves true", async () => {
    renderEditor({ displayName: "Old name" });
    const input = await openEditor();
    fireEvent.change(input, { target: { value: "New name" } });

    fireEvent.keyDown(input, { key: "Enter", isComposing: false });

    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: "Call title" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Rename call" })).toBeInTheDocument();
  });

  it("stays open when onSave resolves false", async () => {
    const { onSave } = renderEditor({ onSave: vi.fn(async () => false) });
    const input = await openEditor();
    fireEvent.change(input, { target: { value: "Rejected name" } });

    fireEvent.keyDown(input, { key: "Enter", isComposing: false });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("Rejected name");
    });
    expect(screen.getByRole("textbox", { name: "Call title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save title" })).toBeInTheDocument();
  });

  it("disables the save button while a save is in flight", async () => {
    let resolveSave: (ok: boolean) => void = () => {};
    const onSave = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderEditor({ onSave });
    const input = await openEditor();
    fireEvent.change(input, { target: { value: "Deferred save" } });

    fireEvent.click(screen.getByRole("button", { name: "Save title" }));

    expect(onSave).toHaveBeenCalledWith("Deferred save");
    expect(screen.getByRole("button", { name: "Save title" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Call title" })).toBeDisabled();

    await act(async () => {
      resolveSave(true);
    });

    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: "Call title" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Rename call" })).toBeInTheDocument();
  });
});
