import Link from "next/link";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

export default function Tutorials() {
  const tutorials = [
    {
      title: "FastAPI Authentication with JWT and Argon2",
      slug: "fastapi-auth-argon2",
      description: "Learn to design a secure, database-backed REST API authentication pipeline in Python using JWT and Argon2.",
      duration: "35 mins",
      difficulty: "Intermediate",
    },
    {
      title: "Next.js 15 App Router & Docker Compose Orchestration",
      slug: "nextjs-docker-compose",
      description: "Step-by-step blueprint to scaffold, containerize, and link Next.js frontends and FastAPI backends behind an Nginx proxy.",
      duration: "45 mins",
      difficulty: "Advanced",
    },
    {
      title: "PostgreSQL Schema Modeling with UUIDs and Alembic",
      slug: "postgres-uuid-alembic",
      description: "Configure Alembic migrations database pipelines, establish models relations, and support UUID primary keys.",
      duration: "25 mins",
      difficulty: "Intermediate",
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Technical Tutorials
          </h1>
          <p className="text-lg text-muted">
            Practical programming guides, architecture blueprints, and systems setup tutorials grounding computer science theory in clean, working code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutorials.map((tut) => (
            <div key={tut.slug} className="glass-card p-6 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-primary mb-4">
                  <span className="bg-primary/10 rounded-full px-2.5 py-1">{tut.difficulty}</span>
                  <span className="flex items-center text-muted">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {tut.duration}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{tut.title}</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">{tut.description}</p>
              </div>

              <div className="border-t border-border/60 pt-4">
                <Link
                  href={`/tutorials/${tut.slug}`}
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                >
                  <span>Start Reading</span>
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
