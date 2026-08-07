"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare, CornerDownRight, Trash2, Loader2, User, Send, X, Paperclip, Star, Edit2 } from "lucide-react";

interface ProfileMini {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface UserMini {
  id: string;
  email: string;
  profile?: ProfileMini;
  role?: {
    name: string;
    permissions: string[];
  };
}

interface CommentData {
  id: string;
  content_id: string;
  parent_id: string | null;
  body: string;
  image_url: string | null;
  is_edited: boolean;
  average_rating: number | null;
  ratings_count: number;
  user_rating: number | null;
  created_at: string;
  updated_at: string;
  author: UserMini;
  replies: CommentData[];
}

interface CommentSectionProps {
  contentId: string;
}

// Relative time formatter
function formatCommentDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to get user initials for avatar fallback
function getInitials(user: UserMini) {
  const profile = user.profile;
  if (profile?.first_name) {
    return `${profile.first_name[0]}${profile.last_name ? profile.last_name[0] : ""}`.toUpperCase();
  }
  return user.email[0].toUpperCase();
}

// Client-side image compressor using HTML Canvas
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas compression to Blob failed"));
            }
          },
          "image/jpeg",
          0.7 // 70% quality compression
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// URL parser to dynamically auto-link URLs in comment bodies
function renderCommentBody(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith("www.") ? `https://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// Recursive Comment Node Component
interface CommentNodeProps {
  comment: CommentData;
  user: any;
  depth?: number;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  onPostReply: (e: React.FormEvent, parentId: string, replyText: string, imageBlob: Blob | null) => Promise<boolean>;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, editText: string) => Promise<boolean>;
  onImageEnlarge: (url: string) => void;
  onRateComment: (commentId: string, rating: number) => Promise<void>;
}

function CommentNode({
  comment,
  user,
  depth = 0,
  replyingToId,
  setReplyingToId,
  onPostReply,
  onDeleteComment,
  onEditComment,
  onImageEnlarge,
  onRateComment,
}: CommentNodeProps) {
  const isDeleted = comment.body === "[Comment deleted]";
  const isAuthor = user && comment.author.id === user.id;
  const isAdminOrEditor = user && (user.role?.name === "Administrator" || user.role?.name === "Editor");
  const canDelete = !isDeleted && (isAuthor || isAdminOrEditor);

  // Local state for the reply form of this specific comment node
  const [localReplyText, setLocalReplyText] = useState("");
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  
  // Local state for comment editing
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Local state for hover states in rating stars
  const [hoverRating, setHoverRating] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup local preview URL when file changes or component unmounts
  useEffect(() => {
    return () => {
      if (localImagePreview) {
        URL.revokeObjectURL(localImagePreview);
      }
    };
  }, [localImagePreview]);

  // Update edit text if database model changes
  useEffect(() => {
    setEditText(comment.body);
  }, [comment.body]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalImageFile(file);
      if (localImagePreview) {
        URL.revokeObjectURL(localImagePreview);
      }
      setLocalImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setLocalImageFile(null);
    if (localImagePreview) {
      URL.revokeObjectURL(localImagePreview);
      setLocalImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localReplyText.trim()) return;

    setReplySubmitting(true);
    let compressedBlob: Blob | null = null;

    if (localImageFile) {
      setCompressing(true);
      try {
        compressedBlob = await compressImage(localImageFile);
      } catch (err) {
        console.error("Failed to compress image:", err);
      } finally {
        setCompressing(false);
      }
    }

    const success = await onPostReply(e, comment.id, localReplyText, compressedBlob);
    if (success) {
      setLocalReplyText("");
      clearSelectedImage();
    }
    setReplySubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;

    setEditSubmitting(true);
    const success = await onEditComment(comment.id, editText);
    if (success) {
      setIsEditing(false);
    }
    setEditSubmitting(false);
  };

  return (
    <div className="group mt-4 text-sm font-sans">
      {/* Comment Header Card */}
      <div className="flex items-start space-x-3">
        {/* Avatar circle */}
        <div className="h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center text-xs font-bold text-muted select-none shrink-0 border border-border/30 overflow-hidden">
          {isDeleted ? (
            <User className="h-4 w-4 text-muted/50" />
          ) : comment.author.profile?.avatar_url ? (
            <img
              src={comment.author.profile.avatar_url}
              alt={comment.author.profile.first_name || "User Avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(comment.author)
          )}
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-2 text-xs">
            <span className={`font-bold ${isDeleted ? "text-muted/60" : "text-foreground"}`}>
              {isDeleted
                ? "Deleted Comment"
                : comment.author.profile?.first_name
                ? `${comment.author.profile.first_name} ${comment.author.profile.last_name || ""}`
                : comment.author.email.split("@")[0]}
            </span>
            
            {!isDeleted && comment.author.role?.name && (
              <span className="text-[9px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded leading-none select-none">
                {comment.author.role.name}
              </span>
            )}

            <span className="text-muted/50 text-[10px] select-none">
              {formatCommentDate(comment.created_at)}
            </span>

            {/* Edited indicator note */}
            {!isDeleted && comment.is_edited && (
              <span className="text-muted/40 text-[9px] font-medium select-none italic">(edited)</span>
            )}
          </div>

          {/* Content text / Edit Form */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-2 mt-1.5 max-w-xl">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                maxLength={1000}
                className="w-full text-xs md:text-sm bg-background border border-border/50 focus:border-primary/80 focus:ring-1 focus:ring-primary focus:outline-none rounded-md p-2.5 resize-none text-foreground"
                required
              />
              <div className="flex justify-end space-x-2 text-[10px] md:text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.body);
                  }}
                  className="px-3 py-1.5 border border-border/60 hover:bg-surface rounded-md text-muted/80 hover:text-foreground font-semibold cursor-pointer transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting || !editText.trim()}
                  className="px-3.5 py-1.5 border border-border rounded-md text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition duration-150 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <p className={`leading-relaxed text-xs md:text-sm whitespace-pre-line py-0.5 ${isDeleted ? "text-muted/50 italic" : "text-muted"}`}>
              {isDeleted ? comment.body : renderCommentBody(comment.body)}
            </p>
          )}

          {/* Optional attached comment image thumbnail */}
          {!isDeleted && comment.image_url && (
            <div className="mt-2.5 max-w-[240px] rounded-lg overflow-hidden border border-border/40 bg-surface/50 max-h-40 flex items-center cursor-zoom-in hover:opacity-90 transition duration-150">
              <img
                src={comment.image_url}
                alt="Attached image"
                onClick={() => onImageEnlarge(comment.image_url as string)}
                className="max-h-40 w-full object-contain"
              />
            </div>
          )}

          {/* Actions row: Reply, Rate (star reaction bar), Edit, Delete */}
          {!isDeleted && !isEditing && (
            <div className="flex items-center flex-wrap gap-y-2 gap-x-4 pt-1 text-[10px] md:text-xs text-muted/60 select-none">
              {user ? (
                <button
                  onClick={() => {
                    setReplyingToId(replyingToId === comment.id ? null : comment.id);
                  }}
                  className="flex items-center space-x-1 hover:text-primary transition font-medium cursor-pointer"
                >
                  <CornerDownRight className="h-3 w-3" />
                  <span>Reply</span>
                </button>
              ) : null}

              {/* Star Rating Reaction Bar */}
              <div className="flex items-center space-x-1 border border-border/40 rounded-full px-2 py-0.5 bg-surface/30">
                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      disabled={!user}
                      onClick={() => {
                        const nextVal = comment.user_rating === starVal ? 0 : starVal;
                        onRateComment(comment.id, nextVal);
                      }}
                      onMouseEnter={() => user && setHoverRating(starVal)}
                      onMouseLeave={() => user && setHoverRating(0)}
                      className={`text-muted/30 hover:text-amber-400 transition p-0.5 ${
                        user ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      title={user ? `Rate ${starVal} Star${starVal > 1 ? "s" : ""}` : "Sign in to rate"}
                    >
                      <Star
                        className={`h-3.5 w-3.5 transition-all duration-100 ${
                          starVal <= (hoverRating || comment.user_rating || 0)
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-muted/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {comment.ratings_count > 0 && (
                  <span className="text-[9px] font-semibold text-muted/80 pl-1 border-l border-border/30">
                    {comment.average_rating?.toFixed(1)} ({comment.ratings_count})
                  </span>
                )}
              </div>

              {/* Edit Comment option for author */}
              {isAuthor && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditText(comment.body);
                  }}
                  className="flex items-center space-x-1 hover:text-primary transition font-medium cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="flex items-center space-x-1 hover:text-red-500 transition font-medium text-red-500/80 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Form (renders inline below comment if selected) */}
      {replyingToId === comment.id && (
        <form
          onSubmit={handleFormSubmit}
          className="mt-3 ml-11 border border-border/40 rounded-lg p-3 bg-surface/30 space-y-2.5 max-w-xl"
        >
          <div className="text-[10px] text-muted font-medium flex items-center space-x-1">
            <span>Replying to</span>
            <span className="font-bold">
              {comment.author.profile?.first_name || comment.author.email.split("@")[0]}
            </span>
          </div>

          <textarea
            value={localReplyText}
            onChange={(e) => setLocalReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={1000}
            className="w-full text-xs md:text-sm bg-background border border-border/50 focus:border-primary/80 focus:ring-1 focus:ring-primary focus:outline-none rounded-md p-2.5 resize-none text-foreground"
            required
          />

          {localImagePreview && (
            <div className="relative mt-2 inline-block rounded-lg overflow-hidden border border-border/50 bg-black/5 max-h-24">
              <img src={localImagePreview} alt="Preview" className="max-h-24 object-contain" />
              <button
                type="button"
                onClick={clearSelectedImage}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/85 text-white p-1 rounded-full cursor-pointer transition"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center text-[10px] md:text-xs pt-1">
            {/* Attachment Trigger (Paperclip style) */}
            <div className="flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id={`reply-file-${comment.id}`}
              />
              <label
                htmlFor={`reply-file-${comment.id}`}
                className="p-1.5 border border-border/60 hover:bg-surface rounded text-muted/80 hover:text-foreground cursor-pointer transition flex items-center space-x-1"
                title="Attach an image"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="text-[9px] font-medium hidden sm:inline">Attach Image</span>
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(null);
                  clearSelectedImage();
                }}
                className="px-3 py-1.5 border border-border/60 hover:bg-surface rounded-md text-muted/80 hover:text-foreground font-semibold cursor-pointer transition duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replySubmitting || compressing || !localReplyText.trim()}
                className="px-3.5 py-1.5 border border-border rounded-md text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition duration-150 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {replySubmitting || compressing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{compressing ? "Compressing..." : "Replying..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>Post Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Nested Replies (indented recursion with thread guide line) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 md:ml-6 pl-3 border-l border-border/30 mt-2 space-y-3">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              user={user}
              depth={depth + 1}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              onPostReply={onPostReply}
              onDeleteComment={onDeleteComment}
              onEditComment={onEditComment}
              onImageEnlarge={onImageEnlarge}
              onRateComment={onRateComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Comment Section Component
export default function CommentSection({ contentId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  
  // Main comment form state
  const [newCommentText, setNewCommentText] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  
  // Shared reply selection state (keeps only one reply form active at a time)
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  
  // Lightbox modal state for image enlargement
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments and verify user session on mount
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch("/api/v1/users/me");
        if (userRes.ok) {
          const payload = await userRes.json();
          if (payload.success) {
            setUser(payload.data);
          }
        }
      } catch (err) {
        // Guest user
      }

      try {
        const commentsRes = await fetch(`/api/v1/comments/content/${contentId}`);
        if (commentsRes.ok) {
          const payload = await commentsRes.json();
          if (payload.success) {
            setComments(payload.data);
          }
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [contentId]);

  // Clean up main image preview URL
  useEffect(() => {
    return () => {
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview);
      }
    };
  }, [mainImagePreview]);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview);
      }
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const clearMainSelectedImage = () => {
    setMainImageFile(null);
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
      setMainImagePreview(null);
    }
    if (mainFileInputRef.current) {
      mainFileInputRef.current.value = "";
    }
  };

  // Recursively counts all comments in the tree
  const countAllComments = (list: CommentData[]): number => {
    let count = list.length;
    for (const comment of list) {
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies);
      }
    }
    return count;
  };

  const totalCommentsCount = countAllComments(comments);

  // Post top-level comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    setError(null);
    
    let compressedBlob: Blob | null = null;
    if (mainImageFile) {
      setCompressing(true);
      try {
        compressedBlob = await compressImage(mainImageFile);
      } catch (err) {
        console.error("Failed to compress main comment image:", err);
      } finally {
        setCompressing(false);
      }
    }

    const formData = new FormData();
    formData.append("content_id", contentId);
    formData.append("body", newCommentText);
    if (compressedBlob) {
      formData.append("image", compressedBlob, "image.jpg");
    }

    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        body: formData, // boundary set automatically by browser
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        setComments([...comments, { ...payload.data, replies: [] }]);
        setNewCommentText("");
        clearMainSelectedImage();
      } else {
        setError(payload.detail || "Failed to post comment.");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Callback to post reply (passed to nodes)
  const handlePostReply = async (
    e: React.FormEvent,
    parentId: string,
    replyText: string,
    imageBlob: Blob | null
  ): Promise<boolean> => {
    setError(null);
    const formData = new FormData();
    formData.append("content_id", contentId);
    formData.append("parent_id", parentId);
    formData.append("body", replyText);
    if (imageBlob) {
      formData.append("image", imageBlob, "reply_image.jpg");
    }

    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        body: formData,
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        const newReply = { ...payload.data, replies: [] };
        
        // Recursive helper to insert new reply in the comments tree
        const addReplyToTree = (list: CommentData[]): CommentData[] => {
          return list.map((c) => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newReply] };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: addReplyToTree(c.replies) };
            }
            return c;
          });
        };

        setComments(addReplyToTree(comments));
        setReplyingToId(null);
        return true;
      } else {
        setError(payload.detail || "Failed to post reply.");
        return false;
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
      return false;
    }
  };

  // Edit comment handler
  const handleEditComment = async (commentId: string, text: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        // Recursive helper to replace updated comment node in the comments tree state
        const updateTreeEdit = (list: CommentData[]): CommentData[] => {
          return list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                body: payload.data.body,
                is_edited: payload.data.is_edited,
                updated_at: payload.data.updated_at,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateTreeEdit(c.replies) };
            }
            return c;
          });
        };

        setComments(updateTreeEdit(comments));
        return true;
      } else {
        setError(payload.detail || "Failed to edit comment.");
        return false;
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
      return false;
    }
  };

  // Rate comment reaction handler
  const handleRateComment = async (commentId: string, starRating: number) => {
    try {
      const res = await fetch(`/api/v1/comments/${commentId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: starRating }),
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        const updateTreeRating = (list: CommentData[]): CommentData[] => {
          return list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                average_rating: payload.data.average_rating,
                ratings_count: payload.data.ratings_count,
                user_rating: payload.data.user_rating,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateTreeRating(c.replies) };
            }
            return c;
          });
        };

        setComments(updateTreeRating(comments));
      } else {
        setError(payload.detail || "Failed to update comment rating.");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: "DELETE",
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        const updateTreeAfterDelete = (list: CommentData[]): CommentData[] => {
          if (payload.meta?.cleared_body) {
            return list.map((c) => {
              if (c.id === commentId) {
                return { ...c, body: "[Comment deleted]" };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateTreeAfterDelete(c.replies) };
              }
              return c;
            });
          } else {
            return list
              .filter((c) => c.id !== commentId)
              .map((c) => {
                if (c.replies && c.replies.length > 0) {
                  return { ...c, replies: updateTreeAfterDelete(c.replies) };
                }
                return c;
              });
          }
        };

        setComments(updateTreeAfterDelete(comments));
      } else {
        alert(payload.detail || "Failed to delete comment.");
      }
    } catch (err) {
      alert("An unexpected network error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="mt-12 pt-8 border-t border-border/50 flex items-center justify-center text-muted font-sans">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
        <span className="text-xs">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="mt-16 pt-10 border-t border-border/60 font-sans">
      <div className="flex items-center space-x-2.5 mb-6 text-foreground font-sans">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-base md:text-lg font-bold tracking-tight">
          Discussion ({totalCommentsCount})
        </h2>
      </div>

      {error && (
        <div className="mb-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Main Comment Input Form */}
      {user ? (
        <form onSubmit={handlePostComment} className="space-y-3 mb-8">
          <div className="flex items-start space-x-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20 select-none overflow-hidden">
              {user.profile?.avatar_url ? (
                <img
                  src={user.profile.avatar_url}
                  alt="My Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user)
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
                rows={3}
                maxLength={1000}
                className="w-full text-xs md:text-sm bg-surface/30 border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-lg p-3 resize-none text-foreground placeholder:text-muted/40 transition duration-150"
                required
              />

              {mainImagePreview && (
                <div className="relative mt-2 inline-block rounded-lg overflow-hidden border border-border/50 bg-black/5 max-h-32">
                  <img src={mainImagePreview} alt="Preview" className="max-h-32 object-contain" />
                  <button
                    type="button"
                    onClick={clearMainSelectedImage}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/85 text-white p-1 rounded-full cursor-pointer transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            {/* Attachment Input (Paperclip style) */}
            <div className="flex items-center">
              <input
                type="file"
                ref={mainFileInputRef}
                accept="image/*"
                onChange={handleMainImageChange}
                className="hidden"
                id="main-comment-file"
              />
              <label
                htmlFor="main-comment-file"
                className="px-3 py-1.5 border border-border rounded-md text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition duration-150 flex items-center space-x-1.5 cursor-pointer"
                title="Attach an image"
              >
                <Paperclip className="h-4 w-4" />
                <span>Attach Image</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || compressing || !newCommentText.trim()}
              className="rounded-md border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition duration-150 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {submitting || compressing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{compressing ? "Compressing..." : "Posting..."}</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-surface/30 border border-border/40 rounded-xl p-6 text-center text-muted mb-8">
          <p className="text-xs md:text-sm font-medium mb-3">
            Please sign in to join the discussion.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 rounded-md border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-surface text-muted hover:text-foreground transition duration-150"
          >
            <span>Sign In</span>
          </Link>
        </div>
      )}

      {/* Comments List Thread Rendering */}
      {comments.length > 0 ? (
        <div className="space-y-6 font-sans">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              user={user}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              onPostReply={handlePostReply}
              onDeleteComment={handleDeleteComment}
              onEditComment={handleEditComment}
              onImageEnlarge={setEnlargedImageUrl}
              onRateComment={handleRateComment}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-muted/50 text-xs font-medium border border-dashed border-border/40 rounded-xl bg-surface/10">
          No comments yet. Be the first to start the discussion!
        </div>
      )}

      {/* Minimalistic Lightbox Modal overlay for Image Enlargement */}
      {enlargedImageUrl && (
        <div
          onClick={() => setEnlargedImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-200 cursor-zoom-out"
        >
          {/* Close trigger button */}
          <button
            onClick={() => setEnlargedImageUrl(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white hover:text-white p-2 rounded-full cursor-pointer transition border border-white/15"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>
          
          <img
            src={enlargedImageUrl}
            alt="Enlarged comment view"
            className="max-w-[92vw] max-h-[92vh] object-contain select-none shadow-2xl rounded-lg border border-white/10"
            onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking on image
          />
        </div>
      )}
    </div>
  );
}
