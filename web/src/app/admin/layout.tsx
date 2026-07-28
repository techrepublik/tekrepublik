"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Image as ImageIcon, Settings, LogOut, Globe, FolderTree, Menu, X, Cpu, CreditCard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/users/me");
        if (!res.ok) {
          // Redirect to login if unauthenticated
          router.push("/");
          return;
        }
        const payload = await res.json();
        const role = payload.data.role.name;
        
        // Allow Administrator, Editor, or Author
        if (role !== "Administrator" && role !== "Editor" && role !== "Author") {
          router.push("/");
          return;
        }
        
        setUser(payload.data);
        setLoading(false);
      } catch (err) {
        router.push("/");
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      router.push("/");
    }
  };

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "New Content", href: "/admin/content/new", icon: FileText },
    { name: "Taxonomy", href: "/admin/taxonomy", icon: FolderTree },
    { name: "Media Assets", href: "/admin/media", icon: ImageIcon },
    { name: "Checkout Review", href: "/admin/orders", icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-muted">Checking authorization rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-surface shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight text-foreground">techrepubl1k CMS</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-background hover:text-primary transition"
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-2">
          <div className="flex items-center space-x-3 px-3 py-2 text-xs">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.profile?.first_name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="font-semibold text-foreground truncate">{user.profile?.first_name || "Admin"}</p>
              <p className="text-[10px] text-muted truncate">{user.role.name}</p>
            </div>
          </div>
          
          <Link
            href="/"
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-background hover:text-secondary transition"
          >
            <Globe className="h-4 w-4" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-surface md:hidden shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight text-foreground text-sm">techrepubl1k CMS</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-muted hover:text-foreground"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden bg-background/80 backdrop-blur-sm">
            <div className="w-64 border-r border-border bg-surface flex flex-col">
              <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                <span className="font-bold text-foreground">techrepubl1k CMS</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-4 py-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-background hover:text-primary transition"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border p-4 space-y-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body Container */}
        <main className="flex-grow overflow-y-auto bg-background p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
