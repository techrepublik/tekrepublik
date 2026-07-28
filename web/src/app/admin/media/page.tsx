"use client";

import { useEffect, useState } from "react";
import { Upload, ImageIcon, Copy, Check, FileText } from "lucide-react";

export default function AdminMedia() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/v1/media");
      const payload = await res.json();
      setMediaList(payload.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const res = await fetch("/api/v1/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        fetchMedia();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to upload file");
      }
      setUploading(false);
    } catch (err) {
      alert("Error uploading file");
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Media Library</h1>
        <p className="text-sm text-muted">Upload and manage image assets, PDF guides, and downloadable files.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Panel */}
        <div className="glass-card p-6 rounded-xl border border-border h-fit">
          <h3 className="font-bold text-foreground text-sm border-b border-border/60 pb-2 mb-4">Upload Asset</h3>
          
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 cursor-pointer transition bg-background/30 text-center">
            <Upload className="h-10 w-10 text-muted mb-4" />
            <span className="text-sm font-semibold text-foreground">
              {uploading ? "Uploading file..." : "Select File"}
            </span>
            <span className="text-xs text-muted mt-1">Images, PDF guides, code files</span>
            <input
              type="file"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Media Grid Library */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl border border-border/60 overflow-hidden">
            <div className="p-4 border-b border-border/60 bg-surface/50 font-bold text-foreground text-sm">
              Asset Catalog
            </div>

            {mediaList.length === 0 ? (
              <div className="p-12 text-center text-muted text-sm">
                No files uploaded yet. Select a file on the left side to upload.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {mediaList.map((media) => (
                  <div key={media.id} className="p-4 flex items-center justify-between hover:bg-surface/35 transition space-x-4">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                        {media.mimetype.startsWith("image/") ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-foreground text-sm truncate">{media.filename}</p>
                        <p className="text-xs text-muted font-mono truncate">{media.url}</p>
                        <p className="text-[10px] text-muted">
                          {media.mimetype} • {formatSize(media.size_bytes)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(media.url, media.id)}
                      className="p-2 text-muted hover:text-foreground transition rounded-lg border border-border/60 bg-surface hover:bg-background shrink-0 flex items-center space-x-1 text-xs"
                      title="Copy URL"
                    >
                      {copiedId === media.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-secondary" />
                          <span className="text-secondary">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
