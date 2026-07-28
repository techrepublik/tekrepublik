import Link from "next/link";
import { Cpu } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface text-muted">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Tagline */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                techrepubl1k<span className="text-primary">.com</span>
              </span>
            </div>
            <p className="text-xs">
              Joseph Lorilla's professional digital platform for software engineering, academic research, and artificial intelligence mentoring.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Content</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/tutorials" className="hover:text-primary transition">Tutorials</Link></li>
              <li><Link href="/articles" className="hover:text-primary transition">Articles</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition">Blog Posts</Link></li>
              <li><Link href="/projects" className="hover:text-primary transition">Projects Portfolio</Link></li>
            </ul>
          </div>

          {/* Professional Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Offerings</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-primary transition">Consulting Services</Link></li>
              <li><Link href="/services" className="hover:text-primary transition">Corporate Training</Link></li>
              <li><Link href="/resources" className="hover:text-primary transition">Downloadable Resources</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition">Project Inquiries</Link></li>
            </ul>
          </div>

          {/* Legal / Disclosures */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal & Disclosures</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/ai-usage" className="text-secondary hover:text-secondary-dark font-medium transition">AI Usage Notice</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition">Terms of Use</Link></li>
              <li><span className="text-xs block text-muted/60 mt-1">Affiliate Disclosure: Some articles may contain links to premium tools.</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-8 flex flex-col md:flex-row items-center justify-between text-xs">
          <p>© {currentYear} Joseph Lorilla. All rights reserved.</p>
          <p className="mt-2 md:mt-0 text-muted/60">Designed with modern aesthetics & AI assistance.</p>
        </div>
      </div>
    </footer>
  );
}
