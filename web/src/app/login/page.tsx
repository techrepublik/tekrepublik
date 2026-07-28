"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Mail, User as UserIcon, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    const url = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";
    const body = isLogin
      ? { email, password }
      : { email, password, first_name: firstName, last_name: lastName };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        if (isLogin) {
          // If login is successful, check role for redirection
          const role = payload.data.user.role_name;
          if (role === "Administrator" || role === "Editor" || role === "Author") {
            router.push("/admin");
          } else {
            router.push("/resources");
          }
        } else {
          // If registration is successful, automatically switch to login form
          setIsLogin(true);
          setError("Account created successfully! Please log in.");
        }
      } else {
        setError(payload.detail || payload.error || "Authentication failed");
      }
    } catch (err) {
      setError("AI Service connection offline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 sm:py-24 bg-background text-foreground px-4">
      <div className="w-full max-w-md space-y-8 glass-card p-8 rounded-2xl border border-border/60 hover-lift shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            {isLogin
              ? "Sign in to manage the CMS or access premium blueprints"
              : "Register to track progress and download free blueprints"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-3 py-2 focus:border-primary focus:outline-none text-foreground"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Last Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-3 py-2 focus:border-primary focus:outline-none text-foreground"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-3 py-2 focus:border-primary focus:outline-none text-foreground"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-3 py-2 focus:border-primary focus:outline-none text-foreground"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 font-semibold text-white transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
          >
            <span>{loading ? "Processing..." : isLogin ? "Sign In" : "Register"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-border/60 text-xs">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-semibold"
          >
            {isLogin ? "Need an account? Register here" : "Already have an account? Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}
