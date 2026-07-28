import { ShieldAlert, Info, Key, Eye } from "lucide-react";

export default function AIUsageNotice() {
  const sections = [
    {
      title: "Grounded Knowledge Boundaries",
      description: "Our AI Assistant outputs are grounded directly in the verified computer science tutorials, research articles, projects, and site guides published on this platform. The AI does not crawl or output random internet references.",
      icon: Info,
    },
    {
      title: "Verification Requirements",
      description: "While the AI assistant utilizes verified platform documents, LLM outputs may contain inaccuracies. Always review and verify code snippets, database schemas, and terminal commands in sandboxed environments before deployment.",
      icon: ShieldAlert,
    },
    {
      title: "Logging and Quality Control",
      description: "Conversations are logged chronologically to evaluate answer completeness and safety. Do not post personal credentials, database tokens, passwords, or proprietary files. Check our conversation retention guidelines.",
      icon: Eye,
    },
    {
      title: "Operational Limitations",
      description: "The AI agent acts as a conversational reading assistant and mentor. It does not possess administrative privileges, cannot modify database records, edit content drafts, or execute payment triggers autonomously.",
      icon: Key,
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            AI Agent Usage Notice
          </h1>
          <p className="text-lg text-muted">
            Disclosures regarding conversational grounding, safety rules, data privacy, and verification guidelines.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div key={sec.title} className="glass-card p-6 rounded-xl border border-border flex items-start space-x-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{sec.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{sec.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout box */}
        <div className="glass-card p-8 rounded-2xl border-l-4 border-l-primary border border-border text-sm text-muted leading-relaxed">
          <p className="font-semibold text-foreground mb-2">Notice of Professional Scope:</p>
          <p>
            AI Agent responses are designed to provide rapid conceptual reviews, summaries, and learning explanations. They do not constitute formal systems engineering, legal, or professional tech consultancy audits. For critical production designs, please contact Joseph Lorilla directly via the <a href="/contact" className="text-primary hover:underline font-semibold">Contact Page</a> to align on consulting scopes.
          </p>
        </div>
      </div>
    </div>
  );
}
