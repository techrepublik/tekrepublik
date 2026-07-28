import Link from "next/link";
import { Layers, Presentation, Settings, Brain, ArrowRight } from "lucide-react";

export default function Services() {
  const services = [
    {
      title: "System Architecture Consulting",
      description: "Design modular, containerized backend services, database relational models, and cache configurations built to scale.",
      details: ["Microservices decomposition", "PostgreSQL database optimization", "API contract blueprints", "Dockerized architectures"],
      icon: Layers,
    },
    {
      title: "Technical Developer Training",
      description: "Structured corporate programs and workshops to upgrade developer teams on Python, FastAPI, Next.js, and Docker.",
      details: ["FastAPI REST API design", "Next.js App Router & TypeScript", "Docker Compose environments", "Clean coding practices"],
      icon: Presentation,
    },
    {
      title: "Custom Systems Development",
      description: "End-to-end implementation of secure databases, admin dashboards, backends, and responsive web portals.",
      details: ["FastAPI and SQLAlchemy backends", "Next.js visual interfaces", "Role-Based Access Controls", "Third-party integrations"],
      icon: Settings,
    },
    {
      title: "AI Integration & Grounding",
      description: "Configure Retrieval-Augmented Generation (RAG) loops, grounding workflows, prompting versions registry, and usage auditing.",
      details: ["Vector indexes configuration", "Prompt engineering audits", "Ollama & remote provider fallbacks", "Usage and cost tracking"],
      icon: Brain,
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Professional Services
          </h1>
          <p className="text-lg text-muted">
            Leveraging engineering theory and production experience to deliver robust architectures, trainings, and customized systems.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="glass-card p-8 rounded-2xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{service.title}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">{service.description}</p>
                  
                  <ul className="space-y-2 mb-8 text-sm text-muted">
                    {service.details.map((detail) => (
                      <li key={detail} className="flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2"></span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-t border-border/60 pt-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to action panel */}
        <div className="bg-gradient-premium rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden text-center max-w-4xl mx-auto">
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Have a Custom Project or Training Requirement?</h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
              Reach out with details about your stack, timeline, and team size. I will follow up to align on customized scopes and architectures.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center space-x-2 rounded-lg bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-slate-100 transition"
              >
                <span>Submit Inquiry</span>
                <ArrowRight className="h-4 w-4 text-slate-900" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
