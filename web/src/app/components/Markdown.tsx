"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";

interface MarkdownProps {
  content: string;
}

// Inner component for interactive copy code button
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 font-mono text-xs overflow-x-auto my-6 relative group">
      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3 text-[10px] uppercase tracking-wider text-muted font-sans">
        <span className="flex items-center">
          <Terminal className="h-3.5 w-3.5 mr-1 text-primary" />
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 hover:text-foreground text-muted transition rounded hover:bg-background"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="text-muted/95 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Split content by code blocks: ```[lang]\n[code]\n```
  const parts = content.split(/```/);

  return (
    <div className="space-y-4 leading-relaxed text-muted text-sm sm:text-base font-sans">
      {parts.map((part, index) => {
        const isCodeBlock = index % 2 === 1;

        if (isCodeBlock) {
          // Extract language and actual code content
          const lines = part.split("\n");
          const firstLine = lines[0].trim();
          const lang = ["python", "js", "ts", "bash", "json", "html", "css"].includes(firstLine.toLowerCase())
            ? firstLine
            : "";
          const code = (lang ? lines.slice(1) : lines).join("\n").trim();
          
          return <CodeBlock key={index} code={code} lang={lang || "code"} />;
        }

        // For non-code blocks, parse lines
        const lines = part.split("\n");
        return (
          <div key={index} className="space-y-4">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) return null;

              // 1. Headers
              if (trimmed.startsWith("# ")) {
                return (
                  <h1 key={lIdx} className="text-3xl font-extrabold tracking-tight text-foreground mt-8 mb-4">
                    {trimmed.replace("# ", "")}
                  </h1>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={lIdx} className="text-2xl font-bold text-foreground mt-8 mb-4">
                    {trimmed.replace("## ", "")}
                  </h2>
                );
              }
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={lIdx} className="text-xl font-bold text-foreground mt-6 mb-3">
                    {trimmed.replace("### ", "")}
                  </h3>
                );
              }
              if (trimmed.startsWith("#### ")) {
                return (
                  <h4 key={lIdx} className="text-lg font-semibold text-foreground mt-4 mb-2">
                    {trimmed.replace("#### ", "")}
                  </h4>
                );
              }

              // 2. Bullet list items
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                const itemText = trimmed.substring(2);
                return (
                  <ul key={lIdx} className="list-disc pl-5 space-y-1">
                    <li className="text-muted">{parseInline(itemText)}</li>
                  </ul>
                );
              }

              // 3. Numbered list items
              if (/^\d+\.\s/.test(trimmed)) {
                const itemText = trimmed.replace(/^\d+\.\s/, "");
                return (
                  <ol key={lIdx} className="list-decimal pl-5 space-y-1">
                    <li className="text-muted">{parseInline(itemText)}</li>
                  </ol>
                );
              }

              // 4. Default paragraphs
              return (
                <p key={lIdx} className="text-muted leading-relaxed">
                  {parseInline(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Minimal helper to render bold text
function parseInline(text: string) {
  const boldParts = text.split(/\*\*/g);
  if (boldParts.length === 1) return text;
  
  return boldParts.map((part, i) => {
    const isBold = i % 2 === 1;
    return isBold ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part;
  });
}
