import Link from "next/link";
import { ArrowLeft, Cpu, Terminal } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetail({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-accent mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>

        <article className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Project Case Study</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </h1>
            <p className="text-sm text-muted">Architect: Joseph Lorilla • Completed: 2026</p>
          </div>

          <div className="border-t border-b border-border/60 py-6 my-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">JL</div>
              <div>
                <p className="text-xs font-bold">Joseph Lorilla</p>
                <p className="text-[10px] text-muted">Lead System Architect</p>
              </div>
            </div>
          </div>

          {/* Dummy Content */}
          <div className="space-y-6 leading-relaxed text-muted text-sm sm:text-base">
            <h2 className="text-xl font-bold text-foreground mb-4">Project Overview</h2>
            <p>
              This case study evaluates the design challenges, deployment choices, and database structure of our customized microservices billing system.
            </p>

            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Key Architectures</h2>
            <p>
              By containerizing Next.js for high-fidelity views rendering, and dedicating a separate container to FastAPI to perform database mappings, we separated client connections from data write requests. Under stress testing, this minimized database lock wait times by 80%.
            </p>

            <div className="rounded-xl border border-border bg-card p-4 font-mono text-xs text-muted/90 overflow-x-auto my-6">
              <div className="flex items-center space-x-2 text-[10px] text-accent uppercase tracking-wider mb-2">
                <Cpu className="h-4 w-4" />
                <span>Docker Orchestration Mapping</span>
              </div>
              <p>&gt; docker compose exec db psql -U postgres -d techrepublik</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
