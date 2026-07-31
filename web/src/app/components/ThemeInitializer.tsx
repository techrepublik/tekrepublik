"use client";

import { useServerInsertedHTML } from "next/navigation";

export default function ThemeInitializer() {
  useServerInsertedHTML(() => {
    return (
      <script
        id="theme-initializer-script"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `,
        }}
      />
    );
  });

  return null;
}
