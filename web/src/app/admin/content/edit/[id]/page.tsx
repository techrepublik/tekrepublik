"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Edit3, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import ContentBodyEditor from "@/app/components/ContentBodyEditor";

export default function EditContent() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Composer fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentType, setContentType] = useState("tutorial");
  const [status, setStatus] = useState("draft");
  const [accessLevel, setAccessLevel] = useState("public");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing taxonomies and current article data
  useEffect(() => {
    if (!contentId) return;

    async function loadData() {
      try {
        // 1. Fetch categories
        const catRes = await fetch("/api/v1/taxonomy/categories");
        const catData = await catRes.json();
        setCategories(catData.data || []);

        // 2. Fetch tags
        const tagRes = await fetch("/api/v1/taxonomy/tags");
        const tagData = await tagRes.json();
        setTags(tagData.data || []);

        // 3. Fetch current article details
        const contentRes = await fetch(`/api/v1/content/${contentId}`);
        const contentPayload = await contentRes.json();

        if (contentRes.ok && contentPayload.success) {
          const item = contentPayload.data;
          setTitle(item.title);
          setSlug(item.slug);
          setContentType(item.content_type);
          setStatus(item.status);
          setAccessLevel(item.access_level);
          setSummary(item.summary || "");
          setBody(item.body || "");
          setSelectedCats((item.categories || []).map((c: any) => c.id));
          setSelectedTags((item.tags || []).map((t: any) => t.id));
        } else {
          setError(contentPayload.detail || "Failed to load content details");
        }
        setLoading(false);
      } catch (err) {
        setError("CMS backend offline");
        setLoading(false);
      }
    }

    loadData();
  }, [contentId]);

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
    setError(null);

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
      const res = await fetch(`/api/v1/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const err = await res.json();
        setError(err.detail || "Failed to update content details");
        setSubmitting(false);
      }
    } catch (err) {
      setError("Error submitting updates to server");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="p-2 text-muted hover:text-foreground transition bg-surface rounded-lg border border-border/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center">
            <Edit3 className="h-6 w-6 text-primary mr-2" />
            Edit Content
          </h1>
          <p className="text-sm text-muted">Revise title fields, edit Markdown bodies, or adjust access configurations.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-sm max-w-xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Body Content (Markdown & HTML)
              </label>
              <ContentBodyEditor
                value={body}
                onChange={setBody}
                placeholder="Write in Markdown or HTML formatting..."
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
            <Save className="h-5 w-5" />
            <span>{submitting ? "Saving revisions..." : "Publish Revisions"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
