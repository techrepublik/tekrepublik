"use client";

import React, { useState, useRef } from "react";
import { renderMarkdownToHtml } from "@/app/utils/markdown";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Terminal,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Table,
  Minus,
  Eye,
  Edit2,
  Columns,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles
} from "lucide-react";

interface ContentBodyEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function ContentBodyEditor({
  value,
  onChange,
  placeholder = "Write the markdown or HTML content here...",
  minHeight = "450px"
}: ContentBodyEditorProps) {
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("split");
  const [formatMode, setFormatMode] = useState<"md" | "html">("md");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and preview panel in split screen
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (viewMode !== "split" || !textareaRef.current || !previewContainerRef.current) return;
    
    const textarea = textareaRef.current;
    const preview = previewContainerRef.current;
    
    // Calculate percentage
    const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
  };

  // Helper function to insert formatting tags at current cursor selection
  const insertFormat = (formatType: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let selectionOffsetStart = 0;
    let selectionOffsetEnd = 0;

    const isMd = formatMode === "md";

    switch (formatType) {
      case "bold":
        replacement = isMd ? `**${selectedText || "bold text"}**` : `<strong>${selectedText || "bold text"}</strong>`;
        selectionOffsetStart = isMd ? 2 : 8;
        selectionOffsetEnd = isMd ? -2 : -9;
        break;
      case "italic":
        replacement = isMd ? `*${selectedText || "italic text"}*` : `<em>${selectedText || "italic text"}</em>`;
        selectionOffsetStart = isMd ? 1 : 4;
        selectionOffsetEnd = isMd ? -1 : -5;
        break;
      case "underline":
        replacement = `<u>${selectedText || "underlined text"}</u>`;
        selectionOffsetStart = 3;
        selectionOffsetEnd = -4;
        break;
      case "strikethrough":
        replacement = isMd ? `~~${selectedText || "strike text"}~~` : `<del>${selectedText || "strike text"}</del>`;
        selectionOffsetStart = isMd ? 2 : 5;
        selectionOffsetEnd = isMd ? -2 : -6;
        break;
      case "h1":
        replacement = isMd ? `# ${selectedText || "Heading 1"}` : `<h1>${selectedText || "Heading 1"}</h1>`;
        selectionOffsetStart = isMd ? 2 : 4;
        selectionOffsetEnd = isMd ? 0 : -5;
        break;
      case "h2":
        replacement = isMd ? `## ${selectedText || "Heading 2"}` : `<h2>${selectedText || "Heading 2"}</h2>`;
        selectionOffsetStart = isMd ? 3 : 4;
        selectionOffsetEnd = isMd ? 0 : -5;
        break;
      case "h3":
        replacement = isMd ? `### ${selectedText || "Heading 3"}` : `<h3>${selectedText || "Heading 3"}</h3>`;
        selectionOffsetStart = isMd ? 4 : 4;
        selectionOffsetEnd = isMd ? 0 : -5;
        break;
      case "quote":
        replacement = isMd ? `> ${selectedText || "Blockquote text"}` : `<blockquote>${selectedText || "Blockquote text"}</blockquote>`;
        selectionOffsetStart = isMd ? 2 : 12;
        selectionOffsetEnd = isMd ? 0 : -13;
        break;
      case "code":
        replacement = isMd ? `\`${selectedText || "code"}\`` : `<code>${selectedText || "code"}</code>`;
        selectionOffsetStart = isMd ? 1 : 6;
        selectionOffsetEnd = isMd ? -1 : -7;
        break;
      case "codeblock":
        replacement = isMd 
          ? `\`\`\`javascript\n${selectedText || "// code here"}\n\`\`\`` 
          : `<pre>\n  <code>\n    ${selectedText || "// code here"}\n  </code>\n</pre>`;
        selectionOffsetStart = isMd ? 13 : 18;
        selectionOffsetEnd = isMd ? -4 : -19;
        break;
      case "list":
        replacement = isMd 
          ? `- ${selectedText || "list item"}` 
          : `<ul>\n  <li>${selectedText || "list item"}</li>\n</ul>`;
        selectionOffsetStart = isMd ? 2 : 11;
        selectionOffsetEnd = isMd ? 0 : -12;
        break;
      case "list-ordered":
        replacement = isMd 
          ? `1. ${selectedText || "list item"}` 
          : `<ol>\n  <li>${selectedText || "list item"}</li>\n</ol>`;
        selectionOffsetStart = isMd ? 3 : 11;
        selectionOffsetEnd = isMd ? 0 : -12;
        break;
      case "link":
        replacement = isMd 
          ? `[${selectedText || "link text"}](https://example.com)` 
          : `<a href="https://example.com">${selectedText || "link text"}</a>`;
        selectionOffsetStart = isMd ? 1 : 9;
        selectionOffsetEnd = isMd ? -23 : -4;
        break;
      case "image":
        replacement = isMd 
          ? `![${selectedText || "image alt"}](https://example.com/image.png)` 
          : `<img src="https://example.com/image.png" alt="${selectedText || "image alt"}" />`;
        selectionOffsetStart = isMd ? 2 : 10;
        selectionOffsetEnd = isMd ? -32 : -4;
        break;
      case "hr":
        replacement = isMd ? `\n---\n` : `\n<hr />\n`;
        selectionOffsetStart = replacement.length;
        selectionOffsetEnd = 0;
        break;
      case "table":
        replacement = isMd 
          ? `\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n`
          : `\n<table>\n  <thead>\n    <tr>\n      <th>Header 1</th>\n      <th>Header 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Cell 1</td>\n      <td>Cell 2</td>\n    </tr>\n  </tbody>\n</table>\n`;
        selectionOffsetStart = replacement.length;
        selectionOffsetEnd = 0;
        break;
      default:
        return;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Focus and select the default text inside formatting helper
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + selectionOffsetStart;
      const newCursorEnd = start + replacement.length + selectionOffsetEnd;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Handle copy buttons on code blocks via event delegation in the preview pane
  const handleCopyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest(".copy-code-btn") as HTMLButtonElement | null;
    if (!button) return;

    const container = button.closest(".code-block-container");
    if (!container) return;

    const pre = container.querySelector("pre");
    if (!pre) return;

    const codeEl = pre.querySelector("code");
    if (!codeEl) return;

    navigator.clipboard.writeText(codeEl.textContent || "");

    const btnText = button.querySelector(".btn-text");
    if (btnText) {
      const originalText = btnText.textContent || "Copy";
      btnText.textContent = "Copied!";
      button.classList.add("text-secondary");
      
      setTimeout(() => {
        btnText.textContent = originalText;
        button.classList.remove("text-secondary");
      }, 2000);
    }
  };

  // Stats calculation
  const getStats = () => {
    const chars = value.length;
    const words = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.round(words / 200)); // ~200 WPM
    return { chars, words, readTime };
  };

  const { chars, words, readTime } = getStats();

  return (
    <div
      className={`flex flex-col border border-border bg-card rounded-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl border-primary/20" : "relative shadow-sm hover:border-border/80"
      }`}
    >
      {/* Editor Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border/80">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Format Mode Select */}
          <div className="flex rounded-lg bg-background p-0.5 border border-border/60 text-xs font-semibold mr-2">
            <button
              type="button"
              onClick={() => setFormatMode("md")}
              className={`px-2.5 py-1.5 rounded-md transition ${
                formatMode === "md" ? "bg-surface text-primary shadow-sm font-bold" : "text-muted hover:text-foreground"
              }`}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setFormatMode("html")}
              className={`px-2.5 py-1.5 rounded-md transition ${
                formatMode === "html" ? "bg-surface text-secondary shadow-sm font-bold" : "text-muted hover:text-foreground"
              }`}
            >
              HTML
            </button>
          </div>

          <div className="h-6 w-px bg-border/80 mx-1"></div>

          {/* Heading Buttons */}
          <button
            type="button"
            title="Heading 1"
            onClick={() => insertFormat("h1")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => insertFormat("h2")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => insertFormat("h3")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1"></div>

          {/* Typography Inline Styles */}
          <button
            type="button"
            title="Bold"
            onClick={() => insertFormat("bold")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => insertFormat("italic")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Underline (HTML)"
            onClick={() => insertFormat("underline")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => insertFormat("strikethrough")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1"></div>

          {/* Structured Items */}
          <button
            type="button"
            title="Bullet List"
            onClick={() => insertFormat("list")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => insertFormat("list-ordered")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => insertFormat("quote")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Inline Code"
            onClick={() => insertFormat("code")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Code Block"
            onClick={() => insertFormat("codeblock")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Terminal className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1"></div>

          {/* Embeds */}
          <button
            type="button"
            title="Insert Link"
            onClick={() => insertFormat("link")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Insert Image"
            onClick={() => insertFormat("image")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Insert Table"
            onClick={() => insertFormat("table")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Table className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Insert Divider"
            onClick={() => insertFormat("hr")}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* View Selection & Fullscreen */}
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg bg-background p-0.5 border border-border/60 text-xs font-semibold mr-1.5">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              className={`p-1.5 px-3 rounded-md transition flex items-center gap-1 ${
                viewMode === "write" ? "bg-surface text-primary shadow-sm font-bold" : "text-muted hover:text-foreground"
              }`}
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`p-1.5 px-3 rounded-md transition flex items-center gap-1 ${
                viewMode === "preview" ? "bg-surface text-primary shadow-sm font-bold" : "text-muted hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`p-1.5 px-3 rounded-md transition flex items-center gap-1 ${
                viewMode === "split" ? "bg-surface text-primary shadow-sm font-bold" : "text-muted hover:text-foreground"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split</span>
            </button>
          </div>

          <div className="h-6 w-px bg-border/80 mx-1"></div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-muted/40 text-muted hover:text-foreground rounded-lg transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Editor & Preview Panels Container */}
      <div
        className="flex bg-background divide-x divide-border/60"
        style={{
          height: isFullscreen ? "calc(100vh - 120px)" : "auto",
          minHeight: isFullscreen ? "none" : minHeight
        }}
      >
        {/* Write Pane */}
        {(viewMode === "write" || viewMode === "split") && (
          <div className={`flex flex-col flex-grow flex-1 relative ${viewMode === "write" ? "w-full" : "w-1/2"}`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              placeholder={placeholder}
              className="w-full h-full flex-grow p-5 bg-card/40 focus:bg-card/70 font-mono text-sm leading-relaxed text-foreground border-none outline-none focus:outline-none resize-none overflow-y-auto"
              style={{
                minHeight: isFullscreen ? "100%" : minHeight,
                maxHeight: isFullscreen ? "100%" : "700px"
              }}
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            ref={previewContainerRef}
            onClick={handleCopyClick}
            className={`flex flex-col flex-1 overflow-y-auto p-6 bg-card/20 md:p-8 ${
              viewMode === "preview" ? "w-full" : "w-1/2"
            }`}
            style={{
              minHeight: isFullscreen ? "100%" : minHeight,
              maxHeight: isFullscreen ? "100%" : "700px"
            }}
          >
            <div
              className="markdown-body prose dark:prose-invert max-w-none text-foreground space-y-4 font-sans text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(value) }}
            />
          </div>
        )}
      </div>

      {/* Bottom Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-t border-border/80 text-[11px] text-muted font-medium select-none">
        <div className="flex items-center space-x-4">
          <span>
            Characters: <strong className="text-foreground">{chars.toLocaleString()}</strong>
          </span>
          <span>
            Words: <strong className="text-foreground">{words.toLocaleString()}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Read Time: <strong className="text-foreground">{readTime} min</strong></span>
          </span>
          {formatMode === "md" ? (
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Markdown Mode Enabled</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-secondary">
              <Sparkles className="h-3 w-3" />
              <span>HTML Markup Enabled</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
