import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { fetchAPI } from "@/app/utils/api";

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
          <div className="space-y-8 max-w-4xl">
            {blogs.map((post: any) => (
              <article key={post.slug} className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex items-center space-x-4 text-xs text-muted mb-3 font-semibold">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                      {post.tags?.[0]?.name || "Reflection"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      Version {post.version}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3 hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-sm text-muted mb-4 leading-relaxed">
                    {post.summary || "Read Joseph Lorilla's developer reflections."}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Continue Reading</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
