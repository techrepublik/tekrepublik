import Link from "next/link";
import { Cpu, ArrowRight } from "lucide-react";
import { fetchAPI } from "@/app/utils/api";

export const revalidate = 60; // ISR revalidation

export default async function Projects() {
  let projects = [];
  try {
    const payload = await fetchAPI("/content?content_type=project");
    projects = payload.data || [];
  } catch (err) {
    console.error("Failed to load projects:", err);
  }

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Projects Portfolio
          </h1>
          <p className="text-lg text-muted">
            Case studies of software systems, web applications, and database engines developed for enterprise clients, university operations, and research trials.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
            No projects published in the portfolio yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((proj: any) => (
              <div key={proj.slug} className="glass-card p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-accent mb-4">
                    <span className="bg-accent/10 rounded-full px-2.5 py-1">
                      {proj.categories?.[0]?.name || "Case Study"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{proj.title}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    {proj.summary || "Technical project architecture design breakdown."}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {proj.tags?.map((t: any) => (
                      <span key={t.id} className="text-[10px] bg-surface border border-border/60 text-muted px-2 py-0.5 rounded font-mono">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Link
                    href={`/projects/${proj.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-accent hover:underline"
                  >
                    <span>Read Case Study</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
