import Link from "next/link";
import { BookOpen, GraduationCap, Cpu, Download, ArrowRight, Sparkles, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-premium py-24 sm:py-32 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-accent backdrop-blur-md mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Next-Gen Tech Platform</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
              Learn Software Engineering. <br />
              <span className="text-gradient-primary">Master Artificial Intelligence.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Academic precision meets practical system engineering. Discover technical tutorials, computer science guides, research case studies, and digital products curated by Professor Joseph Lorilla.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tutorials"
                className="flex items-center space-x-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark transition-all duration-200"
              >
                <span>Start Learning</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="flex items-center space-x-2 rounded-lg bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-md"
              >
                <span>Consulting Services</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 hidden lg:block">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-secondary to-transparent blur-3xl"></div>
        </div>
      </section>

      {/* Featured Pillars Section */}
      <section className="py-20 bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Educational & Professional Modules
            </h2>
            <p className="mt-4 text-muted">
              Explore resources structured to bridge the gap between classroom theory and real-world system architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Tutorials */}
            <div className="glass-card p-6 rounded-xl hover-lift">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Tech Tutorials</h3>
              <p className="text-sm text-muted mb-4">
                Step-by-step guides on FastAPI, Next.js, Docker, databases, and clean architecture coding practices.
              </p>
              <Link href="/tutorials" className="inline-flex items-center text-xs font-semibold text-primary hover:underline">
                <span>Browse Guides</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Research & Articles */}
            <div className="glass-card p-6 rounded-xl hover-lift">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary mb-4">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Academic Papers</h3>
              <p className="text-sm text-muted mb-4">
                Deep dives into neural networks, artificial intelligence paradigms, software models, and research insights.
              </p>
              <Link href="/articles" className="inline-flex items-center text-xs font-semibold text-secondary hover:underline">
                <span>Read Articles</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Projects Portfolio */}
            <div className="glass-card p-6 rounded-xl hover-lift">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Case Studies</h3>
              <p className="text-sm text-muted mb-4">
                Production-grade applications showcases, architecture blueprints, and systems development reports.
              </p>
              <Link href="/projects" className="inline-flex items-center text-xs font-semibold text-accent hover:underline">
                <span>View Portfolio</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Downloadable Resources */}
            <div className="glass-card p-6 rounded-xl hover-lift">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Digital Products</h3>
              <p className="text-sm text-muted mb-4">
                Reusable templates, starter codes, system setup boilerplate packages, and study sheets downloads.
              </p>
              <Link href="/resources" className="inline-flex items-center text-xs font-semibold text-primary hover:underline">
                <span>Get Templates</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Section Preview */}
      <section className="py-20 bg-surface/50 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Bridging Academic Precision with Practical Engineering
              </h2>
              <p className="text-muted leading-relaxed">
                As a university professor, software architect, and AI researcher, Joseph Lorilla leverages years of developer consulting and university classes to produce grounded, direct content. No shortcuts, just solid engineering rules.
              </p>
              <div className="pt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center space-x-2 rounded-lg bg-primary/10 hover:bg-primary/20 px-4 py-2.5 font-semibold text-primary transition"
                >
                  <span>Read Profile</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            {/* Visual card */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
              <Terminal className="h-8 w-8 text-primary mb-4" />
              <div className="space-y-4">
                <div className="bg-background/80 rounded p-4 border border-border/60 font-mono text-xs text-muted">
                  <p className="text-primary-dark font-semibold">&gt; info JosephLorilla</p>
                  <p className="mt-1">Class: System Architect & AI Practitioner</p>
                  <p>Expertise: FastAPI, Next.js, Docker, PyTorch</p>
                  <p>Goal: Grounding advanced tech concepts in simple layouts</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JL</div>
                  <div>
                    <h4 className="font-bold text-foreground">Joseph Lorilla</h4>
                    <p className="text-xs text-muted">Founder & Principal Mentor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter signup */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Stay Updated on Tech Insights
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted text-sm">
            Sign up for the newsletter to receive tutorial announcements, coding boilerplate updates, and artificial intelligence resources directly.
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="flex-grow rounded-lg border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary hover:bg-primary-dark px-6 py-3 font-semibold text-white transition text-sm"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
