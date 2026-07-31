export function renderMarkdownToHtml(md: string): string {
  if (!md) return "";

  let html = md;

  // 1. Code blocks (do first to avoid double parsing)
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `
      <pre class="my-1.5 p-2 bg-slate-950 text-slate-200 rounded-md overflow-x-auto font-mono text-[10px] leading-normal border border-border/30 relative group">
        <div class="flex items-center justify-between pb-0 mb-0.5 text-[8px] leading-none uppercase text-slate-500 font-sans tracking-wider select-none">
          <span class="leading-none">${lang || "code"}</span>
          <button type="button" class="copy-code-btn px-1 py-0.5 hover:text-foreground text-slate-400 transition rounded hover:bg-slate-800 cursor-pointer text-[7.5px] leading-none" title="Copy code">
            Copy
          </button>
        </div>
        <code class="font-mono text-[10px] leading-normal block py-0.5">${escapedCode}</code>
      </pre>
    `.trim();
  });

  // 2. Headings (ensure we parse multiline correctly)
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-[10.5px] font-bold text-foreground mt-2 mb-0.5">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-[11.5px] font-bold text-foreground mt-2.5 mb-0.5">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-[12.5px] font-bold text-foreground mt-3 mb-1 border-b border-border/30 pb-0.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-sm font-extrabold tracking-tight text-foreground mt-3.5 mb-1.5">$1</h1>');

  // 3. Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary bg-primary/5 pl-4 py-2.5 my-4 text-muted italic rounded-r-lg">$1</blockquote>');

  // 4. Horizontal Rules
  html = html.replace(/^---$/gim, '<hr class="border-border my-6" />');

  // 5. Images
  html = html.replace(/\!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-4 rounded-xl max-w-full h-auto border border-border shadow-sm" />');

  // 6. Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary font-medium hover:underline inline-flex items-center" target="_blank" rel="noopener noreferrer">$1</a>');

  // 7. Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 8. Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 9. Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-muted/20 text-primary-dark dark:text-primary font-mono text-xs rounded border border-border/40">$1</code>');

  // 10. Lists grouping
  const lines = html.split("\n");
  let inBullet = false;
  let inOrdered = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
    if (bulletMatch) {
      if (inOrdered) {
        processedLines.push("</ol>");
        inOrdered = false;
      }
      if (!inBullet) {
        processedLines.push('<ul class="list-disc pl-6 my-2 space-y-1 text-muted text-sm md:text-base">');
        inBullet = true;
      }
      processedLines.push(`<li>${bulletMatch[3]}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (inBullet) {
        processedLines.push("</ul>");
        inBullet = false;
      }
      if (!inOrdered) {
        processedLines.push('<ol class="list-decimal pl-6 my-2 space-y-1 text-muted text-sm md:text-base">');
        inOrdered = true;
      }
      processedLines.push(`<li>${orderedMatch[3]}</li>`);
      continue;
    }

    if (trimmed === "" || (!bulletMatch && !orderedMatch)) {
      if (inBullet) {
        processedLines.push("</ul>");
        inBullet = false;
      }
      if (inOrdered) {
        processedLines.push("</ol>");
        inOrdered = false;
      }
    }

    if (trimmed === "") {
      processedLines.push("");
    } else {
      // Wrap normal lines in paragraph unless it starts with a block tag
      const startsWithHtmlBlock = /^\s*<(\/?)(div|p|blockquote|pre|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|thead|tbody|th|hr|img|a)\b/i.test(trimmed);
      if (!startsWithHtmlBlock && !trimmed.startsWith("</") && !trimmed.endsWith(">")) {
        processedLines.push(`<p class="my-3 leading-relaxed text-muted text-sm md:text-base">${trimmed}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inBullet) processedLines.push("</ul>");
  if (inOrdered) processedLines.push("</ol>");

  return processedLines.join("\n");
}
