"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, Sparkles, AlertCircle, Link as LinkIcon, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Citation {
  title: string;
  url: string;
  order: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Load conversation ID from localStorage or create a new one on open
  useEffect(() => {
    if (!isOpen) return;

    const savedId = localStorage.getItem("assistant_conv_id");
    if (savedId) {
      setConversationId(savedId);
      loadHistory(savedId);
    } else {
      startNewSession();
    }
  }, [isOpen]);

  const startNewSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_session_id: getAnonymousSessionId(),
        }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        const newId = payload.data.id;
        setConversationId(newId);
        localStorage.setItem("assistant_conv_id", newId);
        setMessages([
          {
            role: "assistant",
            content: "Hello! I am Joseph Lorilla's offline AI Assistant. Ask me anything about Joseph's tutorials, services, research articles, or technology platform guides!",
          },
        ]);
      } else {
        setError("Failed to initialize session");
      }
    } catch (err) {
      setError("AI service offline");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/assistant/conversations/${id}`);
      const payload = await res.json();
      if (res.ok && payload.success) {
        const history = payload.data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          citations: m.citations,
        }));
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              role: "assistant",
              content: "Hello! I am Joseph Lorilla's offline AI Assistant. Ask me anything about Joseph's tutorials, services, research articles, or technology platform guides!",
            },
          ]);
        }
      } else {
        // Session might be expired or cleared in DB, start a new one
        startNewSession();
      }
    } catch (err) {
      setError("Error loading history");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || !conversationId) return;

    const userText = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/assistant/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: payload.data.reply,
            citations: payload.data.citations,
          },
        ]);
      } else {
        setError(payload.detail || "Failed to process question");
      }
    } catch (err) {
      setError("Connection failure");
    } finally {
      setLoading(false);
    }
  };

  const getAnonymousSessionId = () => {
    let trackingId = localStorage.getItem("assistant_session_tracking");
    if (!trackingId) {
      trackingId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("assistant_session_tracking", trackingId);
    }
    return trackingId;
  };

  const handleResetSession = () => {
    if (confirm("Are you sure you want to clear this chat history and start a new conversation session?")) {
      localStorage.removeItem("assistant_conv_id");
      startNewSession();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:scale-105 transition duration-300"
          title="Joseph's AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Slide-over Card Chat Widget */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] rounded-2xl border border-border bg-surface/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <header className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Offline Assistant</h3>
                <p className="text-[10px] text-muted leading-none">Grounded in Joseph's Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetSession}
                className="p-1.5 text-muted hover:text-foreground hover:bg-background rounded-lg transition"
                title="Reset conversation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted hover:text-foreground hover:bg-background rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Messages display viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-background border border-border/60 text-foreground rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Citations badges */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/40 space-y-1">
                        <p className="text-[9px] uppercase tracking-wider text-muted font-bold flex items-center">
                          <LinkIcon className="h-3 w-3 mr-1 text-primary" />
                          Grounded Citations:
                        </p>
                        <div className="flex flex-col space-y-1">
                          {msg.citations.map((cite, cIdx) => (
                            <Link
                              key={cIdx}
                              href={cite.url}
                              target="_blank"
                              className="text-[10px] text-primary hover:underline truncate block"
                            >
                              [{cite.order}] {cite.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Error notifications */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border/60 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center space-x-1.5 shadow-sm">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }}></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }}></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input controls */}
          <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about articles, tutorials, stack..."
              disabled={loading}
              className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none text-foreground"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
