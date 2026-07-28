import Link from "next/link";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { fetchAPI } from "@/app/utils/api";

export const revalidate = 60; // Revalidate pages every 60 seconds (ISR)

export default async function Tutorials() {
  let tutorials = [];
  try {
    const payload = await fetchAPI("/content?content_type=tutorial");
    tutorials = payload.data || [];
  } catch (err) {
    console.error("Failed to load tutorials:", err);
  }

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Technical Tutorials
          </h1>
          <p className="text-lg text-muted">
            Practical programming guides, architecture blueprints, and systems setup tutorials grounding computer science theory in clean, working code.
          </p>
        </div>

        {tutorials.length === 0 ? (
          <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
            No tutorials published yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutorials.map((tut: any) => (
              <div key={tut.slug} className="glass-card p-6 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary mb-4">
                    <span className="bg-primary/10 rounded-full px-2.5 py-1">
                      {tut.categories?.[0]?.name || "Guide"}
                    </span>
                    <span className="flex items-center text-muted">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      v{tut.version}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{tut.title}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    {tut.summary || "Start learning advanced backend development step-by-step."}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Link
                    href={`/tutorials/${tut.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Start Reading</span>
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
