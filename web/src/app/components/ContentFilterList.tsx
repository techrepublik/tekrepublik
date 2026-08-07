"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, X } from "lucide-react";

interface CategoryOrTag {
  id: string;
  name: string;
  slug: string;
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  status: string;
  access_level: string;
  created_at: string;
  updated_at: string;
  version: number;
  summary: string | null;
  categories?: CategoryOrTag[];
  tags?: CategoryOrTag[];
}

interface ContentFilterListProps {
  items: ContentItem[];
  contentType: "tutorial" | "article" | "blog" | "project";
}

export default function ContentFilterList({ items, contentType }: ContentFilterListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 1. Dynamically extract unique categories and tags from the list items
  const categoriesMap = new Map<string, string>();
  const tagsMap = new Map<string, string>();

  items.forEach((item) => {
    item.categories?.forEach((cat) => {
      categoriesMap.set(cat.slug, cat.name);
    });
    item.tags?.forEach((tag) => {
      tagsMap.set(tag.slug, tag.name);
    });
  });

  const categories = Array.from(categoriesMap.entries()).map(([slug, name]) => ({ slug, name }));
  const tags = Array.from(tagsMap.entries()).map(([slug, name]) => ({ slug, name }));

  // 2. Filter items based on active category and tag selections
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      !selectedCategory || item.categories?.some((c) => c.slug === selectedCategory);
    const matchesTag = !selectedTag || item.tags?.some((t) => t.slug === selectedTag);
    return matchesCategory && matchesTag;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Clean, professional filter section wrapper */}
      <div className="bg-surface/30 border border-border/40 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Categories Row */}
        {categories.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted select-none w-20 shrink-0">
              Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition cursor-pointer ${
                  selectedCategory === null
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border/60 hover:bg-surface text-muted hover:text-foreground"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition cursor-pointer ${
                    selectedCategory === cat.slug
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border/60 hover:bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider if both exist */}
        {categories.length > 0 && tags.length > 0 && (
          <div className="border-t border-border/30" />
        )}

        {/* Tags Row */}
        {tags.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted select-none w-20 shrink-0 pt-1.5">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 py-0.5 rounded border text-[11px] font-mono transition cursor-pointer ${
                  selectedTag === null
                    ? "bg-muted/10 border-muted text-muted font-bold"
                    : "border-border/50 hover:bg-surface text-muted/80 hover:text-foreground"
                }`}
              >
                #all
              </button>
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.slug}
                  onClick={() => setSelectedTag(tag.slug)}
                  className={`px-2.5 py-0.5 rounded border text-[11px] font-mono transition cursor-pointer ${
                    selectedTag === tag.slug
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "border-border/50 hover:bg-surface text-muted/80 hover:text-foreground"
                  }`}
                >
                  #{tag.slug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter State Meta Footer: Results details and Clear button */}
        {(selectedCategory || selectedTag) && (
          <div className="flex items-center justify-between text-[11px] text-muted border-t border-border/30 pt-3 select-none">
            <div>
              Showing <span className="font-semibold text-foreground">{filteredItems.length}</span> of{" "}
              <span className="font-semibold text-foreground">{items.length}</span> items
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedTag(null);
              }}
              className="text-red-500 hover:text-red-600 font-semibold cursor-pointer transition flex items-center space-x-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid/List Rendering based on Type */}
      {filteredItems.length === 0 ? (
        <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
          No matches found for your filter selection. Try clearing filters!
        </div>
      ) : contentType === "tutorial" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((tut: any) => (
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
      ) : contentType === "article" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((art: any) => (
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
      ) : contentType === "blog" ? (
        <div className="space-y-8 max-w-4xl">
          {filteredItems.map((post: any) => (
            <article key={post.slug} className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center space-x-4 text-xs text-muted mb-3 font-semibold">
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                    {post.tags?.[0]?.name || "Reflection"}
                  </span>
                  <span>•</span>
                  <span>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((proj: any) => (
            <div key={proj.slug} className="glass-card p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-accent mb-4">
                  <span className="bg-accent/10 rounded-full px-2.5 py-1">
                    {proj.categories?.[0]?.name || "Case Study"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{proj.title}</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  {proj.summary || "Technical project architecture design breakdown."}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {proj.tags?.map((t: any) => (
                    <span key={t.id} className="text-[10px] bg-surface border border-border/60 text-muted px-2 py-0.5 rounded font-mono">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <Link
                  href={`/projects/${proj.slug}`}
                  className="inline-flex items-center text-xs font-semibold text-accent hover:underline"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
