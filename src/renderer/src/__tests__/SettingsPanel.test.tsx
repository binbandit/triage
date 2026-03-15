import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "../components/SettingsPanel";
import type { Settings } from "../types";

const defaultSettings: Settings = {
  repo: "test/repo",
  theme: "dark",
  viewMode: "list",
};

describe("SettingsPanel", () => {
  it("renders settings title", () => {
    render(
      <SettingsPanel settings={defaultSettings} onSettingsChange={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders Appearance section", () => {
    render(
      <SettingsPanel settings={defaultSettings} onSettingsChange={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("shows Dark and Light theme buttons", () => {
    render(
      <SettingsPanel settings={defaultSettings} onSettingsChange={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("calls onSettingsChange when switching to light theme", async () => {
    const onSettingsChange = vi.fn();
    render(
      <SettingsPanel
        settings={defaultSettings}
        onSettingsChange={onSettingsChange}
        onClose={() => {}}
      />,
    );
    await userEvent.click(screen.getByText("Light"));
    expect(onSettingsChange).toHaveBeenCalled();
    // Call the updater function and check the result
    const updater = onSettingsChange.mock.calls[0][0];
    const result = updater(defaultSettings);
    expect(result.theme).toBe("light");
  });

  it("calls onSettingsChange when switching to dark theme", async () => {
    const onSettingsChange = vi.fn();
    const lightSettings = { ...defaultSettings, theme: "light" as const };
    render(
      <SettingsPanel
        settings={lightSettings}
        onSettingsChange={onSettingsChange}
        onClose={() => {}}
      />,
    );
    await userEvent.click(screen.getByText("Dark"));
    const updater = onSettingsChange.mock.calls[0][0];
    const result = updater(lightSettings);
    expect(result.theme).toBe("dark");
  });

  it("calls onClose when X button clicked", async () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel settings={defaultSettings} onSettingsChange={() => {}} onClose={onClose} />,
    );
    // Click the X button (first button)
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows .triage.yml config hint", () => {
    render(
      <SettingsPanel settings={defaultSettings} onSettingsChange={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText(".triage.yml")).toBeInTheDocument();
  });
});
