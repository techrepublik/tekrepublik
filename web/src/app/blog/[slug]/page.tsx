import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetail({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-primary mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Blog</span>
        </Link>

        <article className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Blog Post</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </h1>
            <p className="text-sm text-muted">Published: July 2026 • By Joseph Lorilla</p>
          </div>

          <div className="border-t border-b border-border/60 py-6 my-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">JL</div>
              <div>
                <p className="text-xs font-bold">Joseph Lorilla</p>
                <p className="text-[10px] text-muted">Professor & Blogger</p>
              </div>
            </div>
          </div>

          {/* Dummy Content */}
          <div className="space-y-6 leading-relaxed text-muted text-sm sm:text-base">
            <p>
              As a developer and instructor, I often get asked why I don't just use standard tools like WordPress or Ghost to run my platform. My answer always comes down to control and schema ownership.
            </p>

            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">The Custom Schema Advantage</h2>
            <p>
              When building educational tools, I need relations mapping to link tutorials to resources, files, and AI templates directly. A monolithic engine makes custom databases difficult to format, whereas a simple FastAPI + PostgreSQL environment makes queries straightforward and highly reusable.
            </p>

            <p>
              Furthermore, Decoupling our web client using Next.js means we can serve static pages globally, while keeping private API endpoints completely hidden behind Nginx reverse proxy gates.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
