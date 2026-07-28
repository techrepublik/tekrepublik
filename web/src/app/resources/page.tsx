"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Resources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/v1/resources");
      const payload = await res.json();
      if (res.ok && payload.success) {
        setResources(payload.data || []);
      } else {
        setError(payload.detail || "Failed to load digital resources");
      }
      setLoading(false);
    } catch (err) {
      setError("Resources API offline");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/v1/resources/${id}/download`);
      const payload = await res.json();
      if (res.ok && payload.success) {
        // Trigger file download
        const fileUrl = payload.data.url;
        const link = document.createElement("a");
        link.href = fileUrl;
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(payload.detail || "Unauthorized download access");
      }
    } catch (err) {
      alert("Error initiating file download");
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
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Digital Resources
          </h1>
          <p className="text-lg text-muted">
            Boilerplates, study sheets, and system configuration directories to accelerate development cycles and reinforce learning.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-sm max-w-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resources.length === 0 ? (
          <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
            No digital resources published yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resources.map((res) => (
              <div key={res.id} className="glass-card p-6 sm:p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary mb-4">
                    <span className="bg-primary/10 rounded-full px-2.5 py-1">
                      {res.is_free ? "Free Blueprint" : "Premium Product"}
                    </span>
                    {res.is_gated && (
                      <span className="flex items-center text-amber-500">
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        Gated
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{res.name}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    {res.description || "Downloadable developer guides and boilerplates."}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground bg-secondary/15 text-secondary px-3 py-1 rounded">
                    {res.is_free ? "FREE" : `₱${res.price.toFixed(2)}`}
                  </span>
                  
                  <button
                    onClick={() => handleDownload(res.id, res.name)}
                    className="flex items-center space-x-2 rounded-lg bg-primary hover:bg-primary-dark px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
