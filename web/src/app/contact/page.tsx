"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inquiryType: "general",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Future integration with FastAPI endpoint: POST /api/v1/contact
      // For now, we simulate a network delay and mark success
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        inquiryType: "general",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("Failed to submit inquiry. Please try again later.");
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Contact & Inquiries
          </h1>
          <p className="mt-4 text-lg text-muted">
            Have a project in mind, a corporate training request, or general questions? Submit the form below.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {status === "success" ? (
            <div className="glass-card p-8 rounded-2xl border border-secondary/30 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-secondary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Inquiry Submitted!</h2>
              <p className="text-sm text-muted">
                Thank you for reaching out. Joseph Lorilla will review your details and respond to your email as soon as possible.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 rounded-lg bg-primary hover:bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl border border-border/60 space-y-6">
              {status === "error" && (
                <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 p-4 text-xs text-red-500 border border-red-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground"
                  placeholder="john@example.com"
                />
              </div>

              {/* Inquiry Type */}
              <div>
                <label htmlFor="inquiryType" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Inquiry Type
                </label>
                <select
                  name="inquiryType"
                  id="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground"
                >
                  <option value="general">General Inquiries</option>
                  <option value="architecture">System Architecture Consulting</option>
                  <option value="training">Technical Developer Training</option>
                  <option value="development">Custom Software Development</option>
                  <option value="other">Other Projects</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground"
                  placeholder="Inquiry regarding backend architecture review"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Message Details
                </label>
                <textarea
                  name="message"
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none text-foreground resize-none"
                  placeholder="Please detail your scope, requirements, and tech stack details..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-lg bg-primary hover:bg-primary-dark px-5 py-3.5 text-sm font-semibold text-white transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{status === "submitting" ? "Sending..." : "Submit Inquiry"}</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
