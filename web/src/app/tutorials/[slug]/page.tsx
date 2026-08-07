import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar, Clock } from "lucide-react";
import { fetchAPI } from "@/app/utils/api";
import Markdown from "@/app/components/Markdown";
import CommentSection from "@/app/components/CommentSection";

import { cookies } from "next/headers";

export const revalidate = 60; // ISR revalidation

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TutorialDetail({ params }: PageProps) {
  const { slug } = await params;

  let token = undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get("access_token")?.value;
  } catch (e) {}

  let tutorial = null;
  try {
    const res = await fetchAPI(`/content/slug/${slug}`, { token });
    tutorial = res.data;
  } catch (err: any) {
    if (err.status !== 404 && err.status !== 403) {
      console.error("Failed to fetch tutorial detail:", err);
    }
  }

  if (!tutorial) {
    notFound();
  }

  const formattedDate = new Date(tutorial.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/tutorials"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-primary mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tutorials</span>
        </Link>

        <article className="space-y-6">
          {/* Header Metadata */}
          <div className="space-y-4">
            <span className="inline-block text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1">
              {tutorial.categories?.[0]?.name || "Programming"}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground leading-tight">
              {tutorial.title}
            </h1>
            <div className="flex items-center space-x-4 text-xs text-muted">
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Revision v{tutorial.version}
              </span>
            </div>
          </div>

          {/* Author info section */}
          <div className="border-t border-b border-border/60 py-6 my-8 flex items-center">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                JL
              </div>
              <div>
                <p className="text-xs font-bold">Joseph Lorilla</p>
                <p className="text-[10px] text-muted">Professor & Architect</p>
              </div>
            </div>
          </div>

          {/* Render parsed Markdown body */}
          <div className="markdown-body">
            <Markdown content={tutorial.body} />
          </div>
        </article>

        {/* Comment section */}
        <CommentSection contentId={tutorial.id} />
      </div>
    </div>
  );
}
