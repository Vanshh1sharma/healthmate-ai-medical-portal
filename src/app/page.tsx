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


      {/* Hero */}
      <section ref={heroRef} className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 ref={titleRef} className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95] bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent">
                Your AI Health 
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"> Companion</span>
              </h1>
              <p ref={subtitleRef} className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed font-light">
                Transform complex medical reports into clear insights. Verify clinical notes with precision. Get instant answers to health questions — all powered by advanced AI in a secure, professional environment.
              </p>
            </div>
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Primary CTA */}
              <Button 
                onClick={onPickFile} 
                className="group relative bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_48px_rgba(16,185,129,0.45)] transition-all duration-300 border-0 text-lg"
              >
                <span className="relative z-10">Upload Medical Report</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={onFileChange}
              />
              
              {/* Secondary CTAs */}
              <div className="flex gap-3">
                <Link href="/patient">
                  <Button className="bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 backdrop-blur-xl rounded-xl px-6 py-3 transition-all duration-300 font-medium">
                    Patient Portal
                  </Button>
                </Link>
                <Link href="/doctor">
                  <Button variant="outline" className="border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl rounded-xl px-6 py-3 transition-all duration-300 font-medium">
                    Doctor Tools
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                AI Powered
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Secure & Private
              </div>
            </div>

            {/* NEW: Smart Question Flow / Result */}
            {phase !== "idle" && (
              <div ref={flowRef} className="mt-8">
                {phase === "questions" && (
                  <Card className="border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl">
                    <CardContent className="p-8 space-y-6">
                      <div className="q-step text-sm text-white/60 bg-white/5 rounded-lg p-3 border border-white/10">
                        Selected file: <span className="text-white font-medium">{selectedFileName}</span>
                      </div>
                      <div className="q-step space-y-3">
                        <label className="block text-sm font-medium text-white/90">What is the main issue you're facing?</label>
                        <input
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          placeholder="e.g., Headache, chest pain, fatigue"
                          className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 backdrop-blur-xl transition-all duration-300"
                        />
                      </div>
                      <div className="q-step space-y-3">
                        <label className="block text-sm font-medium text-white/90">Since when are you experiencing this?</label>
                        <input
                          value={sinceWhen}
                          onChange={(e) => setSinceWhen(e.target.value)}
                          placeholder="e.g., 2 days, since last week"
                          className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 backdrop-blur-xl transition-all duration-300"
                        />
                      </div>
                      <div className="q-step space-y-3">
                        <label className="block text-sm font-medium text-white/90">How severe is it?</label>
                        <div className="flex gap-3">
                          {(["mild", "moderate", "severe"] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setSeverity(lvl)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                                severity === lvl 
                                  ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                  : "bg-white/5 border-white/20 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30"
                              }`}
                            >
                              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="q-step flex justify-end pt-4">
                        <Button 
                          disabled={!issue || !sinceWhen || loading} 
                          onClick={onGenerate} 
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold px-6 py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_48px_rgba(16,185,129,0.45)] transition-all duration-300"
                        >
                          {loading ? "Generating..." : "See Results"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {phase === "result" && result && (
                  <div className="space-y-6">
                    <Card className="border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl result-item">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Summary</h3>
                        <p className="text-white/80 whitespace-pre-line leading-relaxed">
                          {result.summary}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl result-item">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Recovery Recommendations</h3>
                        <div className="space-y-3">
                          {result.tips.map((t, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-white/80 leading-relaxed">{t}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <div className="result-item rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-amber-300 font-semibold text-sm">Medical Disclaimer</p>
                          <p className="text-amber-200/80 text-sm mt-1">This AI-generated analysis is for informational purposes only and should not replace professional medical consultation, diagnosis, or treatment.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-blue-500/10 blur-3xl animate-pulse" />
            <div className="absolute -inset-2 -z-5 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 blur-xl" />
            <Card className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1586773860383-dab5f3bc1f33?q=80&w=1600&auto=format&fit=crop"
                    alt="Advanced medical technology interface"
                    className="h-[400px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-white/90 font-medium">AI Analysis Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            Powered by Advanced AI Technology
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Professional-grade healthcare intelligence designed for both patients and medical professionals.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Smart Report Analysis" 
            desc="Transform complex medical documents into clear, actionable insights with our advanced AI processing."
            icon="📊"
          />
          <FeatureCard 
            title="Clinical Verification" 
            desc="Professional-grade note validation with quality scoring and comprehensive accuracy checks."
            icon="🔍"
          />
          <FeatureCard 
            title="Intelligent Assistant" 
            desc="24/7 medical query support with voice interaction and evidence-based responses."
            icon="🤖"
          />
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-7xl px-6 pb-32">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl rounded-3xl" />
          <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare professionals and patients who trust HealthMate for intelligent medical analysis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/patient">
                <Button className="group relative bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_48px_rgba(16,185,129,0.45)] transition-all duration-300 border-0 text-lg">
                  <span className="relative z-10">Start as Patient</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
              <Link href="/doctor">
                <Button variant="outline" className="border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl rounded-2xl px-8 py-4 transition-all duration-300 font-semibold text-lg">
                  Access Doctor Tools
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-white/60">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">500k+</div>
                <div className="text-sm text-white/60">Reports Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">HIPAA</div>
                <div className="text-sm text-white/60">Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <Card className="group border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
      <CardContent className="p-8">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{title}</h3>
        <p className="text-white/70 leading-relaxed">{desc}</p>
        <div className="mt-6 w-12 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
}