import { fetchAPI } from "@/app/utils/api";
import ContentFilterList from "@/app/components/ContentFilterList";

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
        {projects.length === 0 ? (
          <>
            <div className="max-w-3xl mb-16">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
                Projects Portfolio
              </h1>
              <p className="text-lg text-muted">
                Case studies of software systems, web applications, and database engines developed for enterprise clients, university operations, and research trials.
              </p>
            </div>
            <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
              No projects published in the portfolio yet. Check back soon!
            </div>
          </>
        ) : (
          <ContentFilterList
            items={projects}
            contentType="project"
            title="Projects Portfolio"
            description="Case studies of software systems, web applications, and database engines developed for enterprise clients, university operations, and research trials."
          />
        )}
      </div>
    </div>
  );
}
