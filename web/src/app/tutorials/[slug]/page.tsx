import Link from "next/link";
import { ArrowLeft, Sparkles, Terminal } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TutorialDetail({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/tutorials"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-primary mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tutorials</span>
        </Link>

        <article className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Tutorial Guide</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Dynamic Tutorial: {slug.replace(/-/g, " ")}
            </h1>
            <p className="text-sm text-muted">Published: July 2026 • By Joseph Lorilla</p>
          </div>

          <div className="border-t border-b border-border/60 py-6 my-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">JL</div>
              <div>
                <p className="text-xs font-bold">Joseph Lorilla</p>
                <p className="text-[10px] text-muted">Professor & Architect</p>
              </div>
            </div>
            <Link
              href="/contact"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition"
            >
              Ask a Question
            </Link>
          </div>

          {/* Dummy Markdown Content */}
          <div className="space-y-6 leading-relaxed text-muted text-sm sm:text-base">
            <p>
              Welcome to this step-by-step engineering tutorial. In this guide, we decompose the architectural foundations of modern digital systems.
            </p>

            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Architectural Blueprint</h2>
            <p>
              To construct a highly modular service, we separate logic into distinct layout sections: presentation, routing endpoint dependencies, database schema models, and orchestration.
            </p>

            {/* Code Block visual */}
            <div className="rounded-xl border border-border bg-card p-4 font-mono text-xs text-muted/90 overflow-x-auto my-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3 text-[10px] uppercase tracking-wider">
                <span className="flex items-center"><Terminal className="h-3.5 w-3.5 mr-1" /> terminal</span>
                <span>bash</span>
              </div>
              <p className="text-secondary"># Run compose cluster in detached daemon mode</p>
              <p>&gt; docker compose up --build -d</p>
            </div>

            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Summary & Takeaways</h2>
            <p>
              By containerizing backend endpoints behind Nginx proxy routes, we establish clean, secure networks that resolve DNS conflicts and support direct websocket updates.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
