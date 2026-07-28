import Link from "next/link";
import { GraduationCap, Calendar, ArrowRight } from "lucide-react";

export default function Articles() {
  const articles = [
    {
      title: "Digital Transformation in Higher Education",
      slug: "digital-transformation-education",
      description: "Analyzing the transition from monolithic learning portals to decoupled systems, microservices backend, and conversational agents.",
      date: "June 2026",
      category: "Research",
    },
    {
      title: "Optimizing Convolutional Neural Network Image Classifier Inference",
      slug: "cnn-inference-optimization",
      description: "Evaluating memory profiles, compute cycles, and network latencies of convolutional models deployed on edge containers.",
      date: "April 2026",
      category: "AI & ML",
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Research & Articles
          </h1>
          <p className="text-lg text-muted">
            Academic papers, tech evaluations, and research case studies investigating computing paradigms, neural network optimization, and systems engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((art) => (
            <div key={art.slug} className="glass-card p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-secondary mb-4">
                  <span className="bg-secondary/10 rounded-full px-2.5 py-1">{art.category}</span>
                  <span className="flex items-center text-muted">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {art.date}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{art.title}</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">{art.description}</p>
              </div>

              <div className="border-t border-border/60 pt-4">
                <Link
                  href={`/articles/${art.slug}`}
                  className="inline-flex items-center text-xs font-semibold text-secondary hover:underline"
                >
                  <span>Read Article</span>
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
