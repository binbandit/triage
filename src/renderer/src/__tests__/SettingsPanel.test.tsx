import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "../components/SettingsPanel";
import { useSettingsStore } from "../stores/settingsStore";

beforeEach(() => {
  useSettingsStore.setState({
    repo: "test/repo",
    theme: "dark",
    viewMode: "list",
    inlinePRView: false,
    interceptGitHubLinks: false,
  });
});

describe("SettingsPanel", () => {
  it("renders settings title", () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders Appearance section", () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("shows Dark and Light theme buttons", () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("switches to light theme when Light is clicked", async () => {
    render(<SettingsPanel onClose={() => {}} />);
    await userEvent.click(screen.getByText("Light"));
    expect(useSettingsStore.getState().theme).toBe("light");
  });

  it("switches to dark theme when Dark is clicked", async () => {
    useSettingsStore.setState({ theme: "light" });
    render(<SettingsPanel onClose={() => {}} />);
    await userEvent.click(screen.getByText("Dark"));
    expect(useSettingsStore.getState().theme).toBe("dark");
  });

  it("calls onClose when X button clicked", async () => {
    let closed = false;
    render(
      <SettingsPanel
        onClose={() => {
          closed = true;
        }}
      />,
    );
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]);
    expect(closed).toBe(true);
  });

  it("shows .triage.yml config hint", () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByText(".triage.yml")).toBeInTheDocument();
  });

  it("shows inline PR view toggle", () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByText("Inline PR view")).toBeInTheDocument();
  });

  it("toggles inline PR view on click", async () => {
    render(<SettingsPanel onClose={() => {}} />);
    const toggles = screen.getAllByRole("switch");
    // First switch is inline PR view
    expect(toggles[0].getAttribute("aria-checked")).toBe("false");
    await userEvent.click(toggles[0]);
    expect(useSettingsStore.getState().inlinePRView).toBe(true);
  });

  it("shows intercept GitHub links toggle", () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByText("Intercept GitHub links")).toBeInTheDocument();
  });

  it("toggles intercept GitHub links on click", async () => {
    render(<SettingsPanel onClose={() => {}} />);
    const toggles = screen.getAllByRole("switch");
    // Second switch is intercept GitHub links
    expect(toggles[1].getAttribute("aria-checked")).toBe("false");
    await userEvent.click(toggles[1]);
    expect(useSettingsStore.getState().interceptGitHubLinks).toBe(true);
  });
});
