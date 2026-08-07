import { fetchAPI } from "@/app/utils/api";
import ContentFilterList from "@/app/components/ContentFilterList";

export const revalidate = 60; // ISR revalidation

export default async function Blog() {
  let blogs = [];
  try {
    const payload = await fetchAPI("/content?content_type=blog");
    blogs = payload.data || [];
  } catch (err) {
    console.error("Failed to load blog posts:", err);
  }

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Tech Blog
          </h1>
          <p className="text-lg text-muted">
            Personal thoughts, stack developer reviews, and coding reflections on software architecture, artificial intelligence, and developer productivity.
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
            No blog posts published yet. Check back soon!
          </div>
        ) : (
          <ContentFilterList items={blogs} contentType="blog" />
        )}
      </div>
    </div>
  );
}
