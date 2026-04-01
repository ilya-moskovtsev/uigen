import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

test("shows 'Creating' for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "str_replace", path: "/src/Button.tsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "insert", path: "/src/Button.tsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "view", path: "/src/utils.ts" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("shows 'Undoing edit' for str_replace_editor undo_edit command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "undo_edit", path: "/App.jsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

test("shows 'Renaming' for file_manager rename command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "file_manager", args: { command: "rename", path: "/OldName.tsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Renaming OldName.tsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "file_manager", args: { command: "delete", path: "/OldName.tsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Deleting OldName.tsx")).toBeDefined();
});

test("falls back to raw tool name for unknown tool", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "unknown_tool", args: {}, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("shows spinner when state is not result", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "call" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows green dot when state is result with result value", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "ok" }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
