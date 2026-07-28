import { Download, FileText, Code, ArrowRight } from "lucide-react";

export default function Resources() {
  const resources = [
    {
      title: "FastAPI + Next.js Docker Boilerplate",
      description: "A pre-configured Docker Compose environment linking a FastAPI backend and a Next.js App Router frontend behind Nginx.",
      format: "ZIP Archive",
      size: "1.2 MB",
      price: "Free",
      icon: Code,
    },
    {
      title: "PostgreSQL Database Schema Cheat Sheet",
      description: "Quick reference guide containing standard relational blueprints, UUID generation hooks, index types, and database optimization tips.",
      format: "PDF Document",
      size: "340 KB",
      price: "Free",
      icon: FileText,
    },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {resources.map((res) => {
            const Icon = res.icon;
            return (
              <div key={res.title} className="glass-card p-6 sm:p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary mb-4">
                    <span className="bg-primary/10 rounded-full px-2.5 py-1">{res.format}</span>
                    <span className="text-muted">{res.size}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{res.title}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">{res.description}</p>
                </div>

                <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground bg-secondary/15 text-secondary px-3 py-1 rounded">
                    {res.price}
                  </span>
                  <button className="flex items-center space-x-2 rounded-lg bg-primary hover:bg-primary-dark px-4 py-2 text-xs font-semibold text-white transition">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
