"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, FolderTree, Tag, CheckCircle2 } from "lucide-react";

export default function AdminTaxonomy() {
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagSlug, setTagSlug] = useState("");
  
  const [loading, setLoading] = useState(true);

  const fetchTaxonomy = async () => {
    try {
      const catRes = await fetch("/api/v1/taxonomy/categories");
      const catData = await catRes.json();
      setCategories(catData.data || []);

      const tagRes = await fetch("/api/v1/taxonomy/tags");
      const tagData = await tagRes.json();
      setTags(tagData.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/taxonomy/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, slug: catSlug }),
      });
      if (res.ok) {
        setCatName("");
        setCatSlug("");
        fetchTaxonomy();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create category");
      }
    } catch (err) {
      alert("Error submitting category");
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/taxonomy/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName, slug: tagSlug }),
      });
      if (res.ok) {
        setTagName("");
        setTagSlug("");
        fetchTaxonomy();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create tag");
      }
    } catch (err) {
      alert("Error submitting tag");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/v1/taxonomy/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchTaxonomy();
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      const res = await fetch(`/api/v1/taxonomy/tags/${id}`, { method: "DELETE" });
      if (res.ok) fetchTaxonomy();
    } catch (err) {
      alert("Failed to delete tag");
    }
  };

  const autoSlug = (text: string, setSlug: (s: string) => void) => {
    const slugified = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setSlug(slugified);
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Taxonomy Manager</h1>
        <p className="text-sm text-muted">Create and manage content Categories and Tags mapping.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <FolderTree className="h-5 w-5 text-primary mr-2" />
              <span>Add Category</span>
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    autoSlug(e.target.value, setCatSlug);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground"
                  placeholder="e.g. Software Engineering"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Category Slug</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground font-mono"
                  placeholder="software-engineering"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Save Category</span>
              </button>
            </form>
          </div>

          <div className="glass-card rounded-xl border border-border/60 overflow-hidden">
            <div className="p-4 border-b border-border/60 bg-surface/50 font-bold text-foreground text-sm">
              Categories Directory
            </div>
            {categories.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs">No categories created yet.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {categories.map((cat) => (
                  <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-surface/35 transition">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                      <p className="text-xs text-muted font-mono">slug: {cat.slug}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-muted hover:text-red-500 transition rounded hover:bg-background"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Tag className="h-5 w-5 text-secondary mr-2" />
              <span>Add Tag</span>
            </h2>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tag Name</label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    autoSlug(e.target.value, setTagSlug);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground"
                  placeholder="e.g. FastAPI"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tag Slug</label>
                <input
                  type="text"
                  required
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground font-mono"
                  placeholder="fastapi"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-secondary hover:bg-secondary-dark px-4 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Save Tag</span>
              </button>
            </form>
          </div>

          <div className="glass-card rounded-xl border border-border/60 overflow-hidden">
            <div className="p-4 border-b border-border/60 bg-surface/50 font-bold text-foreground text-sm">
              Tags Directory
            </div>
            {tags.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs">No tags created yet.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {tags.map((t) => (
                  <li key={t.id} className="p-4 flex items-center justify-between hover:bg-surface/35 transition">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted font-mono">slug: {t.slug}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(t.id)}
                      className="p-1.5 text-muted hover:text-red-500 transition rounded hover:bg-background"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
