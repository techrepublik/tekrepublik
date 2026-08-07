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
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  // 1. Extract code blocks (do first to avoid double parsing and markdown formatting corruption)
  html = html.replace(/```(\w*)\r?\n([\s\S]*?)\r?\n```/g, (match, lang, code) => {
    const index = codeBlocks.length;
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const blockHtml = `<div class="code-block-container my-4 rounded-xl border border-border/30 bg-slate-950 overflow-hidden shadow-lg group relative">` +
      `<div class="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-border/20 select-none">` +
        `<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">${lang || "code"}</span>` +
        `<button type="button" class="copy-code-btn flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer text-[10px] font-sans py-0.5 px-1.5 rounded hover:bg-slate-800/50" title="Copy code">` +
          `<svg class="copy-icon w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">` +
            `<path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />` +
          `</svg>` +
          `<span class="btn-text">Copy</span>` +
        `</button>` +
      `</div>` +
      `<pre class="p-4 overflow-x-auto font-mono text-xs md:text-sm leading-relaxed text-slate-200"><code class="font-mono block select-text">${escapedCode}</code></pre>` +
    `</div>`;

    codeBlocks.push(blockHtml);
    return `\n{CODEBLOCKPLACEHOLDER${index}}\n`;
  });

  // 1.2. Extract inline code (so formatting rules like italics, bold, links, lists do not affect inline code)
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    const inlineHtml = `<code class="px-1.5 py-0.5 bg-muted/20 text-primary-dark dark:text-primary font-mono text-xs rounded border border-border/40">${code}</code>`;
    inlineCodes.push(inlineHtml);
    return `{INLINECODEPLACEHOLDER${index}}`;
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
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

  // 8. Italic
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^\n_]+)_/g, '<em>$1</em>');

  // 9. Lists grouping
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
        processedLines.push('<ol class="list-none pl-0 my-3 space-y-1.5">');
        inOrdered = true;
      }
      processedLines.push(`<li class="flex items-start space-x-2 text-muted text-sm md:text-base"><span class="font-mono text-xs md:text-sm text-muted/80 select-none w-7 shrink-0 text-right pr-1">${orderedMatch[2]}.</span><span>${orderedMatch[3]}</span></li>`);
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
      // Wrap normal lines in paragraph unless it starts with a block tag or is a placeholder
      const startsWithHtmlBlock = /^\s*<(\/?)(div|p|blockquote|pre|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|thead|tbody|th|hr|img|a)\b/i.test(trimmed);
      const isPlaceholder = trimmed.startsWith("{CODEBLOCKPLACEHOLDER");
      
      if (!startsWithHtmlBlock && !isPlaceholder && !trimmed.startsWith("</") && !trimmed.endsWith(">")) {
        processedLines.push(`<p class="my-3 leading-relaxed text-muted text-sm md:text-base">${trimmed}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inBullet) processedLines.push("</ul>");
  if (inOrdered) processedLines.push("</ol>");

  let result = processedLines.join("\n");

  // 10. Restore inline code blocks
  inlineCodes.forEach((inlineHtml, index) => {
    result = result.split(`{INLINECODEPLACEHOLDER${index}}`).join(inlineHtml);
  });

  // 11. Restore code blocks
  codeBlocks.forEach((blockHtml, index) => {
    result = result.split(`{CODEBLOCKPLACEHOLDER${index}}`).join(blockHtml);
  });

  return result;
}
