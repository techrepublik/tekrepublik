import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { fetchAPI } from "@/app/utils/api";
import Markdown from "@/app/components/Markdown";

export const revalidate = 60; // ISR revalidation

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetail({ params }: PageProps) {
  const { slug } = await params;

  let project = null;
  try {
    const res = await fetchAPI(`/content/slug/${slug}`);
    project = res.data;
  } catch (err: any) {
    if (err.status !== 404) {
      console.error("Failed to fetch project detail:", err);
    }
  }

  if (!project) {
    notFound();
  }

  const formattedDate = new Date(project.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-accent mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>

        <article className="space-y-6">
          {/* Header Metadata */}
          <div className="space-y-4">
            <span className="inline-block text-xs font-bold text-accent bg-accent/10 rounded-full px-3 py-1">
              {project.categories?.[0]?.name || "Case Study"}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground leading-tight">
              {project.title}
            </h1>
            <div className="flex items-center space-x-4 text-xs text-muted">
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {formattedDate}
              </span>
              <span>•</span>
              <span>
                Version {project.version}
              </span>
            </div>
          </div>

          {/* Author card info */}
          <div className="border-t border-b border-border/60 py-6 my-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                JL
              </div>
              <div>
                <p className="text-xs font-bold">Joseph Lorilla</p>
                <p className="text-[10px] text-muted">Lead Systems Architect</p>
              </div>
            </div>
            <Link
              href="/contact"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition"
            >
              Inquire Project
            </Link>
          </div>

          {/* Render parsed Markdown body */}
          <div className="markdown-body">
            <Markdown content={project.body} />
          </div>
        </article>
      </div>
    </div>
  );
}
