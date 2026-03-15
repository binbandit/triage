import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentDialog } from "../components/CommentDialog";
import type { PullRequest } from "../types";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 42,
    title: "Test PR title",
    url: "https://github.com/test/repo/pull/42",
    labels: [],
    state: "OPEN",
    author: { login: "testuser" },
    body: "",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    headRefName: "feature-branch",
    isDraft: false,
    ...overrides,
  };
}

describe("CommentDialog", () => {
  it("renders close action UI", () => {
    render(<CommentDialog pr={makePR()} action="close" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Close PR #42")).toBeInTheDocument();
    expect(screen.getByText("Test PR title")).toBeInTheDocument();
  });

  it("renders merge action UI", () => {
    render(<CommentDialog pr={makePR()} action="merge" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Merge PR #42")).toBeInTheDocument();
  });

  it("shows Close button for close action", () => {
    render(<CommentDialog pr={makePR()} action="close" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("shows Merge button for merge action", () => {
    render(<CommentDialog pr={makePR()} action="merge" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Merge")).toBeInTheDocument();
  });

  it("calls onConfirm with undefined when no comment entered", async () => {
    const onConfirm = vi.fn();
    render(
      <CommentDialog pr={makePR()} action="close" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    await userEvent.click(screen.getByText("Close"));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it("calls onConfirm with comment text", async () => {
    const onConfirm = vi.fn();
    render(
      <CommentDialog pr={makePR()} action="close" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    const textarea = screen.getByPlaceholderText(/reason for closing/i);
    await userEvent.type(textarea, "Not needed anymore");
    await userEvent.click(screen.getByText("Close"));
    expect(onConfirm).toHaveBeenCalledWith("Not needed anymore");
  });

  it("calls onCancel when Cancel button clicked", async () => {
    const onCancel = vi.fn();
    render(<CommentDialog pr={makePR()} action="close" onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when X button clicked", async () => {
    const onCancel = vi.fn();
    render(<CommentDialog pr={makePR()} action="close" onConfirm={() => {}} onCancel={onCancel} />);
    // The X button has an accessible close label-ish approach
    const closeButtons = screen.getAllByRole("button");
    // First button is the X in the header
    await userEvent.click(closeButtons[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it("disables buttons when loading", () => {
    render(
      <CommentDialog
        pr={makePR()}
        action="close"
        onConfirm={() => {}}
        onCancel={() => {}}
        loading
      />,
    );
    expect(screen.getByText("...")).toBeInTheDocument();
    // Cancel and action buttons should be disabled
    const buttons = screen.getAllByRole("button");
    const cancelBtn = buttons.find((b) => b.textContent === "Cancel");
    const actionBtn = buttons.find((b) => b.textContent === "...");
    expect(cancelBtn).toBeDisabled();
    expect(actionBtn).toBeDisabled();
  });

  it("shows merge placeholder text for merge action", () => {
    render(<CommentDialog pr={makePR()} action="merge" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText(/reason for merging/i)).toBeInTheDocument();
  });

  it("focuses textarea on mount", () => {
    render(<CommentDialog pr={makePR()} action="close" onConfirm={() => {}} onCancel={() => {}} />);
    const textarea = screen.getByPlaceholderText(/reason for closing/i);
    expect(document.activeElement).toBe(textarea);
  });

  it("calls onConfirm with undefined for whitespace-only comment", async () => {
    const onConfirm = vi.fn();
    render(
      <CommentDialog pr={makePR()} action="close" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    const textarea = screen.getByPlaceholderText(/reason for closing/i);
    await userEvent.type(textarea, "   ");
    await userEvent.click(screen.getByText("Close"));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it("shows PR title", () => {
    render(
      <CommentDialog
        pr={makePR({ title: "My long PR title" })}
        action="close"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("My long PR title")).toBeInTheDocument();
  });

  it("has optional comment label", () => {
    render(<CommentDialog pr={makePR()} action="close" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Comment")).toBeInTheDocument();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });
});
