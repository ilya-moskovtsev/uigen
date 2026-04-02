import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock FileSystemContext
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useFileSystem: vi.fn(() => ({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
  })),
}));

// Mock ChatContext
vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useChat: vi.fn(() => ({
    messages: [],
    isLoading: false,
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
  })),
}));

// Mock child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

// Mock ResizablePanelGroup to avoid issues in jsdom
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("renders preview view by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("switches to code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Initially preview is visible, code editor is not rendered
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Click the Code tab
  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  // Code editor should be rendered; preview-frame stays mounted but hidden
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("preview-frame").closest(".hidden")).toBeDefined();
});

test("switches back to preview view when Preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Click Code tab first
  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Click Preview tab
  const previewTab = screen.getByRole("tab", { name: "Preview" });
  await user.click(previewTab);

  // Preview wrapper should no longer be hidden; code editor should be gone
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.getByTestId("preview-frame").closest(".hidden")).toBeNull();
});

test("can toggle between preview and code multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  const previewTab = screen.getByRole("tab", { name: "Preview" });

  // Toggle 1: preview -> code
  await user.click(codeTab);
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("preview-frame").closest(".hidden")).toBeDefined();

  // Toggle 2: code -> preview
  await user.click(previewTab);
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.getByTestId("preview-frame").closest(".hidden")).toBeNull();

  // Toggle 3: preview -> code
  await user.click(codeTab);
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Toggle 4: code -> preview
  await user.click(previewTab);
  expect(screen.queryByTestId("code-editor")).toBeNull();
});
