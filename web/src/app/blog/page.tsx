import Link from "next/link";
import { MessageSquare, Calendar, ArrowRight } from "lucide-react";

export default function Blog() {
  const blogs = [
    {
      title: "Why I Bootstrap My Own CMS Instead of Using WordPress",
      slug: "why-bootstrap-custom-cms",
      description: "A developer's reflection on control, speed, Docker networks, API reuse for Flutter, and the power of custom schema ownership.",
      date: "July 2026",
      readTime: "8 mins read",
    },
    {
      title: "Local LLM Inference vs. API Providers: A Developer's Practical Audit",
      slug: "local-llm-vs-api-providers",
      description: "Comparing Ollama running llama3 locally on Mac hardware versus hosted OpenAI/Gemini endpoints on latency and cost.",
      date: "May 2026",
      readTime: "12 mins read",
    },
  ];

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

        <div className="space-y-8 max-w-4xl">
          {blogs.map((post) => (
            <article key={post.slug} className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center space-x-4 text-xs text-muted mb-3 font-semibold">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {post.date}
                  </span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-sm text-muted mb-4 leading-relaxed">{post.description}</p>
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
      </div>
    </div>
  );
}
