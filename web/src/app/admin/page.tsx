"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, FolderTree, Tag, Eye, Edit3, Trash2, Plus, Sparkles } from "lucide-react";

export default function AdminDashboard() {
  const [contentList, setContentList] = useState<any[]>([]);
  const [counts, setCounts] = useState({ content: 0, categories: 0, tags: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch content list
      const contentRes = await fetch("/api/v1/content");
      const contentData = await contentRes.json();
      const list = contentData.data || [];
      setContentList(list);

      // 2. Fetch categories
      const catRes = await fetch("/api/v1/taxonomy/categories");
      const catData = await catRes.json();
      const catCount = (catData.data || []).length;

      // 3. Fetch tags
      const tagRes = await fetch("/api/v1/taxonomy/tags");
      const tagData = await tagRes.json();
      const tagCount = (tagData.data || []).length;

      setCounts({
        content: list.length,
        categories: catCount,
        tags: tagCount
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content item? This will permanently delete all versions history.")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/content/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to delete content");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">CMS Overview</h1>
          <p className="text-sm text-muted">Manage your categories, tags, tutorials, and versions history control.</p>
        </div>
        <Link
          href="/admin/content/new"
          className="inline-flex items-center space-x-2 rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Content</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border border-border flex items-center space-x-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Content Items</p>
            <p className="text-2xl font-bold text-foreground">{counts.content}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-border flex items-center space-x-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Categories</p>
            <p className="text-2xl font-bold text-foreground">{counts.categories}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-border flex items-center space-x-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Tags</p>
            <p className="text-2xl font-bold text-foreground">{counts.tags}</p>
          </div>
        </div>
      </div>

      {/* Content Items List Table */}
      <div className="glass-card rounded-xl border border-border/60 overflow-hidden">
        <div className="p-6 border-b border-border/60 bg-surface/50">
          <h3 className="font-bold text-foreground">Content Catalog</h3>
        </div>

        {contentList.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            No content items created yet. Click "Add Content" to compile your first article or tutorial.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted bg-surface/30 font-semibold">
                  <th className="p-4">Title & Slug</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {contentList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/35 transition">
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted font-mono">/{item.content_type}s/{item.slug}</p>
                    </td>
                    <td className="p-4 uppercase text-xs font-semibold text-muted">{item.content_type}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                          item.status === "published"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted">v{item.version}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/${item.content_type}s/${item.slug}`}
                          target="_blank"
                          className="p-1.5 text-muted hover:text-foreground transition rounded hover:bg-background"
                          title="View Live"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-muted hover:text-red-500 transition rounded hover:bg-background"
                          title="Delete permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
