function parseMarkdownTables(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line looks like a table row: starts with | and ends with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      
      // Check if next line is a table divider: starts/ends with | and only contains pipes, dashes, colons, spaces
      const isDivider = nextLine.startsWith("|") && nextLine.endsWith("|") && /^[|:\-\s]+$/.test(nextLine);

      if (isDivider) {
        const headerRow = line;
        const dividerRow = nextLine;
        const bodyRows: string[] = [];
        
        // Parse column alignments
        const alignments = dividerRow
          .split("|")
          .slice(1, -1)
          .map(col => {
            const trimmedCol = col.trim();
            const alignLeft = trimmedCol.startsWith(":");
            const alignRight = trimmedCol.endsWith(":");
            if (alignLeft && alignRight) return "center";
            if (alignRight) return "right";
            return "left";
          });

        // Parse header texts
        const headers = headerRow
          .split("|")
          .slice(1, -1)
          .map(h => h.trim());

        i += 2; // skip header and divider

        // Read following rows until we exit table structure
        while (i < lines.length) {
          const bodyLine = lines[i].trim();
          if (bodyLine.startsWith("|") && bodyLine.endsWith("|")) {
            bodyRows.push(bodyLine);
            i++;
          } else {
            break;
          }
        }

        // Generate highly professional HTML table structure
        let tableHtml = `<div class="overflow-x-auto my-5 rounded-lg border border-border/40 shadow-sm bg-card">
  <table class="w-full text-left text-xs md:text-sm border-collapse">
    <thead>
      <tr class="border-b border-border/50 bg-muted/15 text-muted font-bold select-none">`;
        
        headers.forEach((header, index) => {
          const align = alignments[index] || "left";
          const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
          tableHtml += `\n        <th class="p-2.5 font-semibold ${alignClass}">${header}</th>`;
        });
        
        tableHtml += `\n      </tr>
    </thead>
    <tbody class="divide-y divide-border/30">`;

        bodyRows.forEach(row => {
          const cells = row
            .split("|")
            .slice(1, -1)
            .map(c => c.trim());
          
          tableHtml += `\n      <tr class="hover:bg-muted/5 transition-colors duration-100">`;
          
          for (let j = 0; j < headers.length; j++) {
            const cellVal = cells[j] || "";
            const align = alignments[j] || "left";
            const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
            tableHtml += `\n        <td class="p-2.5 text-muted ${alignClass}">${cellVal}</td>`;
          }
          tableHtml += `\n      </tr>`;
        });

        tableHtml += `\n    </tbody>
  </table>
</div>`;

        result.push(tableHtml);
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

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
        <div class="absolute right-1.5 top-1.5 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none bg-slate-900/90 border border-slate-800/80 px-1.5 py-0.5 rounded text-[8px] font-sans">
          <span class="uppercase text-slate-500 tracking-wider font-semibold">${lang || "code"}</span>
          <span class="text-slate-800">|</span>
          <button type="button" class="copy-code-btn hover:text-foreground text-slate-400 transition cursor-pointer text-[7.5px] leading-none" title="Copy code">
            Copy
          </button>
        </div>
        <code class="font-mono text-[10px] leading-normal block">${escapedCode}</code>
      </pre>
    `.trim();
  });

  // 1.5. Table parsing
  html = parseMarkdownTables(html);

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
        processedLines.push('<ul>');
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
        processedLines.push('<ol>');
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
