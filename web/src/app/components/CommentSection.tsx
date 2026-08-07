"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, CornerDownRight, Trash2, Loader2, User } from "lucide-react";

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

export default function CommentSection({ contentId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch comments and verify user session on mount
  useEffect(() => {
    async function init() {
      try {
        // 1. Fetch current user
        const userRes = await fetch("/api/v1/users/me");
        if (userRes.ok) {
          const payload = await userRes.json();
          if (payload.success) {
            setUser(payload.data);
          }
        }
      } catch (err) {
        // Not logged in, keep user as null
      }

      try {
        // 2. Fetch comments list
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
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          body: newCommentText,
        }),
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        setComments([...comments, { ...payload.data, replies: [] }]);
        setNewCommentText("");
      } else {
        setError(payload.detail || "Failed to post comment.");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Post reply
  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          parent_id: parentId,
          body: replyText,
        }),
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
        setReplyText("");
        setReplyingToId(null);
      } else {
        setError(payload.detail || "Failed to post reply.");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
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
        // Recursive helper to update comments list
        const updateTreeAfterDelete = (list: CommentData[]): CommentData[] => {
          if (payload.meta?.cleared_body) {
            // Soft delete: replace body text in state
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
            // Hard delete: remove comment completely
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
      <div className="mt-12 pt-8 border-t border-border/50 flex items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
        <span className="text-xs">Loading comments...</span>
      </div>
    );
  }

  // Recursive Comment Node Component
  const CommentNode = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
    const isDeleted = comment.body === "[Comment deleted]";
    const isAuthor = user && comment.author.id === user.id;
    const isAdminOrEditor = user && (user.role?.name === "Administrator" || user.role?.name === "Editor");
    const canDelete = !isDeleted && (isAuthor || isAdminOrEditor);

    return (
      <div className="group mt-4 text-sm">
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
                <span className="text-[9px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded leading-none">
                  {comment.author.role.name}
                </span>
              )}

              <span className="text-muted/50 text-[10px]">
                {formatCommentDate(comment.created_at)}
              </span>
            </div>

            {/* Content text */}
            <p className={`leading-relaxed text-xs md:text-sm whitespace-pre-line py-0.5 ${isDeleted ? "text-muted/50 italic" : "text-muted"}`}>
              {comment.body}
            </p>

            {/* Actions row */}
            {!isDeleted && (
              <div className="flex items-center space-x-4 pt-1 text-[10px] md:text-xs text-muted/60">
                {user ? (
                  <button
                    onClick={() => {
                      setReplyingToId(comment.id);
                      setReplyText("");
                    }}
                    className="flex items-center space-x-1 hover:text-primary transition font-medium cursor-pointer"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                ) : null}

                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
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
            onSubmit={(e) => handlePostReply(e, comment.id)}
            className="mt-3 ml-11 border border-border/40 rounded-lg p-3 bg-surface/30 space-y-2.5 max-w-xl"
          >
            <div className="text-[10px] text-muted font-medium flex items-center space-x-1">
              <span>Replying to</span>
              <span className="font-bold">
                {comment.author.profile?.first_name || comment.author.email.split("@")[0]}
              </span>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              maxLength={1000}
              className="w-full text-xs md:text-sm bg-background border border-border/50 focus:border-primary/80 focus:ring-1 focus:ring-primary focus:outline-none rounded-md p-2.5 resize-none text-foreground placeholder:text-muted/40"
              required
            />
            <div className="flex justify-end space-x-2 text-[10px] md:text-xs">
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className="px-2.5 py-1.5 border border-border/50 hover:bg-surface rounded-md text-muted font-medium cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary-dark cursor-pointer disabled:opacity-50 transition"
              >
                {submitting ? "Replying..." : "Post Reply"}
              </button>
            </div>
          </form>
        )}

        {/* Nested Replies (indented recursion with thread guide line) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 md:ml-6 pl-3 border-l border-border/30 mt-2 space-y-3">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

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
            {/* Current user's avatar fallbacks */}
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
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="text-xs md:text-sm bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Comment"}
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
            className="inline-block text-xs font-semibold bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Comments List Thread Rendering */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-muted/50 text-xs font-medium border border-dashed border-border/40 rounded-xl bg-surface/10">
          No comments yet. Be the first to start the discussion!
        </div>
      )}
    </div>
  );
}
