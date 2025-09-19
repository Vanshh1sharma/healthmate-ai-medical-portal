"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  // New: Upload + flow state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<"idle" | "questions" | "result">("idle");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [issue, setIssue] = useState("");
  const [sinceWhen, setSinceWhen] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: string; tips: string[] } | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(heroRef.current, { opacity: 0, duration: 0.6 })
        .from(titleRef.current, { y: 30, opacity: 0, duration: 0.8 }, "-=0.2")
        .from(subtitleRef.current, { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(ctaRef.current?.children || [], { y: 10, opacity: 0, stagger: 0.12, duration: 0.5 }, "-=0.3");
    });
    return () => ctx.revert();
  }, []);

  // Animate flow when phase changes
  useEffect(() => {
    if (!flowRef.current) return;
    const targets = phase === "questions" ? flowRef.current.querySelectorAll(".q-step") : flowRef.current.querySelectorAll(".result-item");
    if (!targets || targets.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(targets, { opacity: 0, y: 16, stagger: 0.12, duration: 0.5, ease: "power3.out" });
    }, flowRef);
    return () => ctx.revert();
  }, [phase]);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setPhase("questions");
  };

  const onGenerate = async () => {
    setLoading(true);
    try {
      const text = `User issue: ${issue}\nDuration: ${sinceWhen}\nSeverity: ${severity}\nFile: ${selectedFileName}`;
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: "patient" }),
      });
      const data = await res.json();
      setResult({ summary: data.summary || "We generated a simple overview based on your inputs and file.", tips: data.tips || ["Rest well and stay hydrated", "Follow your doctor's advice", "Track symptoms daily"] });
      setPhase("result");
    } catch (err) {
      setResult({ summary: "We couldn't process the file. Showing a basic guide from your answers.", tips: ["Monitor symptoms and seek care if they worsen", "Use over-the-counter relief as appropriate", "Schedule a check-up if persistent"] });
      setPhase("result");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient + grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgba(88,101,242,0.25), transparent 60%), radial-gradient(1000px 500px at -10% 20%, rgba(16,185,129,0.2), transparent 60%)",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/40 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-gradient-to-br from-emerald-400/80 to-indigo-500/80 shadow-[0_0_40px_rgba(99,102,241,0.35)]" />
            <span className="text-lg font-semibold tracking-tight">HealthMate</span>
          </div>
          <nav className="hidden sm:flex items-center gap-2">
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/patient" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Patient</Link>
            <Link href="/doctor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Doctor</Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 ref={titleRef} className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              Your AI Health Companion for patients and doctors
            </h1>
            <p ref={subtitleRef} className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
              HealthMate unveils clear summaries from complex reports, verifies clinical notes, and answers medicine doubts — all in a sleek, secure, and responsive experience.
            </p>
            <div ref={ctaRef} className="mt-8 flex flex-wrap gap-3 items-center">
              {/* NEW: Big Upload button */}
              <Button onClick={onPickFile} className="rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 border border-white/10 backdrop-blur-md px-6 py-6 text-base shadow-[0_8px_40px_rgba(16,185,129,0.25)]">
                Upload Medical Report (PDF/Image)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <Link href="/patient">
                <Button className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-white/10 backdrop-blur-md">
                  Patient Dashboard
                </Button>
              </Link>
              <Link href="/doctor">
                <Button variant="outline" className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10">
                  Doctor Dashboard
                </Button>
              </Link>
              <a href="#about">
                <Button variant="ghost" className="rounded-xl">Learn more</Button>
              </a>
            </div>

            {/* NEW: Smart Question Flow / Result */}
            {phase !== "idle" && (
              <div ref={flowRef} className="mt-8">
                {phase === "questions" && (
                  <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
                    <CardContent className="p-6 space-y-5">
                      <div className="q-step text-sm text-muted-foreground">Selected file: <span className="text-foreground">{selectedFileName}</span></div>
                      <div className="q-step">
                        <label className="block text-sm mb-1">What is the main issue you're facing?</label>
                        <input
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          placeholder="e.g., Headache, chest pain, fatigue"
                          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none"
                        />
                      </div>
                      <div className="q-step">
                        <label className="block text-sm mb-1">Since when are you experiencing this?</label>
                        <input
                          value={sinceWhen}
                          onChange={(e) => setSinceWhen(e.target.value)}
                          placeholder="e.g., 2 days, since last week"
                          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none"
                        />
                      </div>
                      <div className="q-step">
                        <label className="block text-sm mb-1">How severe is it?</label>
                        <div className="flex gap-2">
                          {(["mild", "moderate", "severe"] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setSeverity(lvl)}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${severity === lvl ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"}`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="q-step flex justify-end">
                        <Button disabled={!issue || !sinceWhen || loading} onClick={onGenerate} className="rounded-xl">
                          {loading ? "Generating..." : "See Results"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {phase === "result" && result && (
                  <div className="space-y-4">
                    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl result-item">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Summary</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {result.summary}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl result-item">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Helpful Recovery Tips</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          {result.tips.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <div className="result-item rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200 text-sm">
                      This result is AI-generated and not a substitute for professional medical advice.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-emerald-500/10 to-transparent blur-2xl" />
            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1586773860383-dab5f3bc1f33?q=80&w=1600&auto=format&fit=crop"
                  alt="Futuristic healthcare"
                  className="h-[320px] w-full object-cover"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard title="AI Report Summaries" desc="Upload lab results and get a friendly summary with key insights and trends."/>
          <FeatureCard title="Doctor-grade Tools" desc="Generate technical summaries and verify notes with instant quality checks."/>
          <FeatureCard title="Voice Assistant" desc="Ask medicine questions hands-free with speech-to-text and text-to-speech."/>
        </div>
      </section>

      {/* CTA */}
      <section id="features" className="mx-auto max-w-7xl px-4 pb-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold">Start with HealthMate today</h2>
          <p className="mt-2 text-muted-foreground">Experience a modern, secure, and accessible healthcare platform.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/patient"><Button className="rounded-xl">Go to Patient</Button></Link>
            <Link href="/doctor"><Button variant="outline" className="rounded-xl">Go to Doctor</Button></Link>
          </div>
        </div>
      </section>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}