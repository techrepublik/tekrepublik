import Link from "next/link";
import { ArrowLeft, BookOpen, Quote } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticleDetail({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/articles"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-secondary mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Articles</span>
        </Link>

        <article className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Research Article</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </h1>
            <p className="text-sm text-muted">Published: June 2026 • By Joseph Lorilla</p>
          </div>

          <div className="border-t border-b border-border/60 py-6 my-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">JL</div>
              <div>
                <p className="text-xs font-bold">Joseph Lorilla</p>
                <p className="text-[10px] text-muted">Professor & AI Researcher</p>
              </div>
            </div>
          </div>

          {/* Dummy Content */}
          <div className="space-y-6 leading-relaxed text-muted text-sm sm:text-base">
            <p>
              <strong>Abstract:</strong> This research paper addresses the integration of decentralized architectures and neural networks in digital learning platforms. By implementing loose coupling between content delivery nodes and query handlers, we show significant latency decreases.
            </p>

            <blockquote className="glass-card p-6 border-l-4 border-l-secondary rounded-r-xl my-6 flex items-start space-x-3">
              <Quote className="h-6 w-6 text-secondary shrink-0" />
              <p className="italic text-sm text-foreground">
                "The decoupling of state management from conversational models ensures auditability and cost limits without impacting query validation times."
              </p>
            </blockquote>

            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Introduction</h2>
            <p>
              Traditional systems rely on monolithic platforms that expose single endpoints for data reads and queries. During high traffic periods, database locks degrade client response times. We propose a decoupled architecture utilizing Postgres caching and Celery job distribution queues.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
