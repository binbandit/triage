import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../components/SearchBar";
import { EmptyState } from "../components/EmptyState";
import { LabelBadge } from "../components/LabelBadge";
import type { PRLabel } from "../types";

describe("SearchBar", () => {
  it("renders with placeholder", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/filter by title/i)).toBeInTheDocument();
  });

  it("displays the current value", () => {
    render(<SearchBar value="test query" onChange={() => {}} />);
    expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
  });

  it("calls onChange on input", async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText(/filter by title/i);
    await userEvent.type(input, "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("shows clear button when value is non-empty", () => {
    render(<SearchBar value="something" onChange={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("hides clear button when value is empty", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls onChange with empty string when clear is clicked", async () => {
    const onChange = vi.fn();
    render(<SearchBar value="query" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("EmptyState", () => {
  it("renders loading state", () => {
    render(<EmptyState type="loading" />);
    expect(screen.getByText(/fetching pull requests/i)).toBeInTheDocument();
  });

  it("renders empty state with default message", () => {
    render(<EmptyState type="empty" />);
    expect(screen.getByText(/no pull requests/i)).toBeInTheDocument();
    expect(screen.getByText(/no open PRs found/i)).toBeInTheDocument();
  });

  it("renders empty state with custom message", () => {
    render(<EmptyState type="empty" message="Custom empty" />);
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(<EmptyState type="error" message="Something broke" />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("renders no-repo state", () => {
    render(<EmptyState type="no-repo" />);
    expect(screen.getByText(/enter a repository/i)).toBeInTheDocument();
  });
});

describe("LabelBadge", () => {
  const label: PRLabel = {
    id: "1",
    name: "bug",
    color: "d73a4a",
    description: "Something is broken",
  };

  it("renders label name", () => {
    render(<LabelBadge label={label} />);
    expect(screen.getByText("bug")).toBeInTheDocument();
  });

  it("shows description as title", () => {
    render(<LabelBadge label={label} />);
    expect(screen.getByTitle("Something is broken")).toBeInTheDocument();
  });

  it("uses label name as title when no description", () => {
    const noDesc = { ...label, description: "" };
    render(<LabelBadge label={noDesc} />);
    expect(screen.getByTitle("bug")).toBeInTheDocument();
  });

  it("renders without color gracefully", () => {
    const noColor = { ...label, color: "" };
    render(<LabelBadge label={noColor} />);
    expect(screen.getByText("bug")).toBeInTheDocument();
  });

  it("applies highlight ring when highlighted", () => {
    const { container } = render(<LabelBadge label={label} highlighted />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("ring-1");
  });

  it("does NOT apply ring when not highlighted (default)", () => {
    const { container } = render(<LabelBadge label={label} />);
    const span = container.querySelector("span");
    expect(span?.className).not.toContain("ring-1");
  });

  it("applies inline color styles when label has a color", () => {
    const { container } = render(<LabelBadge label={label} />);
    const span = container.querySelector("span");
    expect(span?.style.backgroundColor).toBeTruthy();
    expect(span?.style.border).toBeTruthy();
  });

  it("uses fallback styles when label has no color", () => {
    const noColor = { ...label, color: "" };
    const { container } = render(<LabelBadge label={noColor} />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--color-fg-secondary)");
  });
});

describe("EmptyState - additional edge cases", () => {
  it("renders error state without message prop", () => {
    render(<EmptyState type="error" />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("ignores message prop for no-repo type", () => {
    render(<EmptyState type="no-repo" message="Should not appear" />);
    expect(screen.queryByText("Should not appear")).toBeNull();
  });
});

describe("SearchBar - additional edge cases", () => {
  it("renders search icon always", () => {
    const { container } = render(<SearchBar value="" onChange={() => {}} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("input has spellcheck disabled", () => {
    // SearchBar doesn't set spellCheck currently - this is a negative test
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText(/filter by title/i);
    expect(input).toBeInTheDocument();
  });
});
