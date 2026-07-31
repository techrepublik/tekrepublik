"use client";

import React from "react";
import { renderMarkdownToHtml } from "@/app/utils/markdown";

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Handle copy buttons on code blocks via event delegation
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest(".copy-code-btn") as HTMLButtonElement | null;
    if (!button) return;

    const pre = button.closest("pre");
    if (!pre) return;

    const codeEl = pre.querySelector("code");
    if (!codeEl) return;

    navigator.clipboard.writeText(codeEl.textContent || "");

    const originalText = button.innerHTML;
    button.innerHTML = "Copied!";
    button.classList.add("text-secondary");
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove("text-secondary");
    }, 2000);
  };

  return (
    <div
      onClick={handleContainerClick}
      className="markdown-body prose dark:prose-invert max-w-none text-foreground space-y-4 font-sans text-sm md:text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
    />
  );
}
