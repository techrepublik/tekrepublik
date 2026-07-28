import Link from "next/link";
import { GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { fetchAPI } from "@/app/utils/api";

export const revalidate = 60; // ISR revalidation

export default async function Articles() {
  let articles = [];
  try {
    const payload = await fetchAPI("/content?content_type=article");
    articles = payload.data || [];
  } catch (err) {
    console.error("Failed to load articles:", err);
  }

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Research & Articles
          </h1>
          <p className="text-lg text-muted">
            Academic papers, tech evaluations, and research case studies investigating computing paradigms, neural network optimization, and systems engineering.
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
            No research articles published yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((art: any) => (
              <div key={art.slug} className="glass-card p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-secondary mb-4">
                    <span className="bg-secondary/10 rounded-full px-2.5 py-1">
                      {art.categories?.[0]?.name || "Research"}
                    </span>
                    <span className="flex items-center text-muted">
                      v{art.version}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{art.title}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    {art.summary || "Explore research reports and systems engineering evaluations."}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Link
                    href={`/articles/${art.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-secondary hover:underline"
                  >
                    <span>Read Article</span>
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
