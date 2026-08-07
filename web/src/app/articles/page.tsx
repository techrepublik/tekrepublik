import { fetchAPI } from "@/app/utils/api";
import ContentFilterList from "@/app/components/ContentFilterList";

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
          <ContentFilterList items={articles} contentType="article" />
        )}
      </div>
    </div>
  );
}
