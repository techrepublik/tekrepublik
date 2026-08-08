import { fetchAPI } from "@/app/utils/api";
import ContentFilterList from "@/app/components/ContentFilterList";

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
        {tutorials.length === 0 ? (
          <>
            <div className="max-w-3xl mb-16">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
                Technical Tutorials
              </h1>
              <p className="text-lg text-muted">
                Practical programming guides, architecture blueprints, and systems setup tutorials grounding computer science theory in clean, working code.
              </p>
            </div>
            <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
              No tutorials published yet. Check back soon!
            </div>
          </>
        ) : (
          <ContentFilterList
            items={tutorials}
            contentType="tutorial"
            title="Technical Tutorials"
            description="Practical programming guides, architecture blueprints, and systems setup tutorials grounding computer science theory in clean, working code."
          />
        )}
      </div>
    </div>
  );
}
