"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Terminal, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NewContent() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentType, setContentType] = useState("tutorial");
  const [status, setStatus] = useState("draft");
  const [accessLevel, setAccessLevel] = useState("public");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const catRes = await fetch("/api/v1/taxonomy/categories");
        const catData = await catRes.json();
        setCategories(catData.data || []);

        const tagRes = await fetch("/api/v1/taxonomy/tags");
        const tagData = await tagRes.json();
        setTags(tagData.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadTaxonomy();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setSlug(slugified);
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTagToggle = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      slug,
      content_type: contentType,
      status,
      access_level: accessLevel,
      summary: summary || null,
      body,
      category_ids: selectedCats,
      tag_ids: selectedTags,
    };

    try {
      const res = await fetch("/api/v1/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save content item");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Error submitting content");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="p-2 text-muted hover:text-foreground transition bg-surface rounded-lg border border-border/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Compile Content</h1>
          <p className="text-sm text-muted">Scaffold tutorials, blog posts, academic articles, or projects portfolio.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main form controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-xl border border-border space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground"
                placeholder="e.g. Next.js Docker Compose Orchestration Guide"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground font-mono"
                placeholder="nextjs-docker-compose-orchestration"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Summary / Teaser</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground resize-none"
                placeholder="Brief summary explaining what this content item covers (max 500 chars)..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex justify-between">
                <span>Markdown Body Content</span>
                <span className="text-[10px] text-muted normal-case font-mono">Supports standard MD / HTML formatting</span>
              </label>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground font-mono resize-y"
                placeholder="## Heading 1&#10;Write the markdown documentation here..."
              />
            </div>
          </div>
        </div>

        {/* Right settings sidebar */}
        <div className="space-y-6">
          {/* Metadata settings */}
          <div className="glass-card p-6 rounded-xl border border-border space-y-4">
            <h3 className="font-bold text-foreground text-sm border-b border-border/60 pb-2">Publish Settings</h3>
            
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground"
              >
                <option value="tutorial">Tutorial</option>
                <option value="article">Research Article</option>
                <option value="blog">Blog Post</option>
                <option value="project">Project Case Study</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Access Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="review">Review pending</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Access Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground"
              >
                <option value="public">Public</option>
                <option value="email_gated">Email gated</option>
                <option value="member_only">Members only</option>
                <option value="premium">Premium users</option>
                <option value="private">Private / Admins</option>
              </select>
            </div>
          </div>

          {/* Taxonomy Selectors */}
          <div className="glass-card p-6 rounded-xl border border-border space-y-4">
            <h3 className="font-bold text-foreground text-sm border-b border-border/60 pb-2">Taxonomy</h3>

            {/* Categories list */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Categories</label>
              <div className="max-h-32 overflow-y-auto space-y-2 border border-border bg-background/50 rounded-lg p-3">
                {categories.length === 0 ? (
                  <p className="text-[10px] text-muted italic">No categories created yet.</p>
                ) : (
                  categories.map((cat) => (
                    <label key={cat.id} className="flex items-center space-x-2 text-xs text-muted cursor-pointer hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={selectedCats.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Tags list */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tags</label>
              <div className="max-h-32 overflow-y-auto space-y-2 border border-border bg-background/50 rounded-lg p-3">
                {tags.length === 0 ? (
                  <p className="text-[10px] text-muted italic">No tags created yet.</p>
                ) : (
                  tags.map((t) => (
                    <label key={t.id} className="flex items-center space-x-2 text-xs text-muted cursor-pointer hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(t.id)}
                        onChange={() => handleTagToggle(t.id)}
                        className="rounded border-border text-secondary focus:ring-secondary h-3.5 w-3.5"
                      />
                      <span>{t.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary hover:bg-primary-dark px-4 py-3 text-sm font-semibold text-white transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            <span>{submitting ? "Saving changes..." : "Save Content"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
