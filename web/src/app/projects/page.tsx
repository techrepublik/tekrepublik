import Link from "next/link";
import { Cpu, Terminal, ArrowRight } from "lucide-react";

export default function Projects() {
  const projects = [
    {
      title: "Decoupled Billing & MIS System",
      slug: "billing-mis-system",
      description: "An automated billing platform built using Next.js App Router, Python FastAPI, and PostgreSQL with manual banking verification loops.",
      tech: ["FastAPI", "Next.js", "Docker", "PostgreSQL"],
      type: "Enterprise",
    },
    {
      title: "RAG Grounded AI Chat Assistant",
      slug: "rag-grounded-chat-assistant",
      description: "A secure assistant utilizing local Ollama models and vector arrays to answer database questions grounded in platform text documents.",
      tech: ["Ollama", "pgvector", "Python", "RAG"],
      type: "AI & ML",
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Projects Portfolio
          </h1>
          <p className="text-lg text-muted">
            Case studies of software systems, web applications, and database engines developed for enterprise clients, university operations, and research trials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj) => (
            <div key={proj.slug} className="glass-card p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-accent mb-4">
                  <span className="bg-accent/10 rounded-full px-2.5 py-1">{proj.type}</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{proj.title}</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">{proj.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {proj.tech.map((t) => (
                    <span key={t} className="text-[10px] bg-surface border border-border/60 text-muted px-2 py-0.5 rounded font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <Link
                  href={`/projects/${proj.slug}`}
                  className="inline-flex items-center text-xs font-semibold text-accent hover:underline"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
