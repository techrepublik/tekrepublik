"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Cpu, Sparkles, Sun, Moon } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    async function checkUser() {
      try {
        const res = await fetch("/api/v1/users/me");
        if (res.ok) {
          const payload = await res.json();
          if (payload.success) {
            setUser(payload.data);
          }
        }
      } catch (err) {
        // Not logged in
      }
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/";
      }
    } catch (err) {}
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navigation = [
    { name: "About", href: "/about" },
    { name: "Tutorials", href: "/tutorials" },
    { name: "Articles", href: "/articles" },
    { name: "Blog", href: "/blog" },
    { name: "Projects", href: "/projects" },
    { name: "Resources", href: "/resources" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground font-sans">
            techrepubl1k<span className="text-primary">.com</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-muted hover:text-primary transition"
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/ai-usage"
            className="flex items-center space-x-1 text-secondary hover:text-secondary-dark transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Notice</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-1.5 text-muted hover:text-primary transition focus:outline-none bg-surface/50 border border-border/40 rounded-lg"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
          
          {user ? (
            <div className="flex items-center space-x-3 border-l border-border pl-4">
              <span className="text-xs text-muted max-w-[120px] truncate font-medium" title={user.email}>
                {user.profile?.first_name || user.email.split("@")[0]}
              </span>
              {(user.role?.name === "Administrator" || user.role?.name === "Editor" || user.role?.name === "Author") && (
                <Link
                  href="/admin"
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded font-semibold transition"
                >
                  CMS
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-600 transition font-medium cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-muted hover:text-primary transition border-l border-border pl-4"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 text-muted hover:text-foreground focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="space-y-2 px-4 pb-4 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted hover:bg-surface hover:text-primary transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/ai-usage"
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-base font-medium text-secondary hover:bg-surface hover:text-secondary-dark transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Notice</span>
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-base font-medium text-muted hover:bg-surface hover:text-primary transition"
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            {user ? (
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                <div className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-muted">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="truncate">{user.profile?.first_name || user.email}</span>
                </div>
                {(user.role?.name === "Administrator" || user.role?.name === "Editor" || user.role?.name === "Author") && (
                  <Link
                    href="/admin"
                    className="block rounded-md px-3 py-2 text-base font-medium text-primary hover:bg-surface transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    CMS Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center rounded-md px-3 py-2 text-base font-medium text-red-500 hover:bg-surface transition cursor-pointer text-left"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted hover:bg-surface hover:text-primary transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
