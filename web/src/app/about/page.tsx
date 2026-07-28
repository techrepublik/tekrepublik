import { GraduationCap, Code, Compass, HeartHandshake, Award } from "lucide-react";

export default function About() {
  const roles = [
    {
      title: "University Professor",
      description: "Mentoring the next generation of engineers and computer scientists with structured, rigorous courses.",
      icon: GraduationCap,
    },
    {
      title: "Software Developer & Architect",
      description: "Designing clean, highly modular, future-ready architectures using FastAPI, Next.js, and container setups.",
      icon: Code,
    },
    {
      title: "AI Practitioner & Researcher",
      description: "Exploring machine learning implementations, neural network optimizations, and conversational retrieval systems.",
      icon: Compass,
    },
    {
      title: "Technology Consultant & Trainer",
      description: "Assisting organizations, training developers, and structuring technical solutions for digital transformations.",
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            About Joseph Lorilla
          </h1>
          <p className="text-lg text-muted">
            Software architect, university professor, AI practitioner, and technopreneur based in the Philippines.
          </p>
        </div>

        {/* Bio Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="lg:col-span-2 space-y-6 text-base leading-relaxed text-muted">
            <h2 className="text-2xl font-bold text-foreground">Academic Precision & Practical Software Development</h2>
            <p>
              I believe that software development is both a rigorous science and a creative engineering craft. As an academic instructor, my goal is to distill high-level concepts—such as database design, concurrent programming, and neural networks—into understandable, code-validated guides.
            </p>
            <p>
              In my consulting work, I build secure, modular API systems and containerized architectures. I bridge the theoretical rigor of research with the production-grade requirements of enterprise software development.
            </p>
            <p>
              Through <strong>techrepubl1k.com</strong>, I share technical tutorials, starter templates, and AI grounding research to help developers and students master modern digital stacks.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl h-fit border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Award className="h-5 w-5 text-primary mr-2" />
              <span>Core Expertise</span>
            </h3>
            <ul className="space-y-3 text-sm text-muted">
              <li>• System Architecture Design</li>
              <li>• FastAPI, Python & REST API Platforms</li>
              <li>• React, Next.js & TypeScript Frontends</li>
              <li>• Docker & Docker Compose Environments</li>
              <li>• PostgreSQL Database Modeling</li>
              <li>• AI Agent Orchestration & Grounding</li>
              <li>• Technical Corporate Trainings</li>
            </ul>
          </div>
        </div>

        {/* Professional Roles Cards */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-10 text-center">Professional Focus Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.title} className="glass-card p-6 rounded-xl border border-border hover-lift">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{role.title}</h3>
                      <p className="text-sm text-muted leading-relaxed">{role.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
