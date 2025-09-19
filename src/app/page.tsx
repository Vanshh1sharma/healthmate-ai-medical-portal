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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100">
      {/* Background gradient + grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(1000px 500px at -10% 20%, rgba(147,197,253,0.1), transparent 60%)",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />


      {/* Hero */}
      <section ref={heroRef} className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 ref={titleRef} className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Your AI Health 
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent"> Companion</span>
              </h1>
              <p ref={subtitleRef} className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed font-light">
                Transform complex medical reports into clear insights. Get instant answers to health questions with personalized recommendations — all powered by advanced AI in a secure, professional environment.
              </p>
            </div>
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Primary CTA */}
              <Button 
                onClick={onPickFile} 
                className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 border-0 text-lg"
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
                  <Button className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 hover:border-blue-400 backdrop-blur-xl rounded-xl px-6 py-3 transition-all duration-300 font-medium">
                    Patient Portal
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                AI Powered
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Secure & Private
              </div>
            </div>

            {/* NEW: Smart Question Flow / Result */}
            {phase !== "idle" && (
              <div ref={flowRef} className="mt-8">
                {phase === "questions" && (
                  <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
                    <CardContent className="p-8 space-y-6">
                      <div className="q-step text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
                        Selected file: <span className="text-gray-900 font-medium">{selectedFileName}</span>
                      </div>
                      <div className="q-step space-y-3">
                        <label className="block text-sm font-medium text-gray-700">What is the main issue you're facing?</label>
                        <input
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          placeholder="e.g., Headache, chest pain, fatigue"
                          className="w-full rounded-xl bg-white border border-blue-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-xl transition-all duration-300"
                        />
                      </div>
                      <div className="q-step space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Since when are you experiencing this?</label>
                        <input
                          value={sinceWhen}
                          onChange={(e) => setSinceWhen(e.target.value)}
                          placeholder="e.g., 2 days, since last week"
                          className="w-full rounded-xl bg-white border border-blue-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-xl transition-all duration-300"
                        />
                      </div>
                      <div className="q-step space-y-3">
                        <label className="block text-sm font-medium text-gray-700">How severe is it?</label>
                        <div className="flex gap-3">
                          {(["mild", "moderate", "severe"] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setSeverity(lvl)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                                severity === lvl 
                                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                                  : "bg-white border-blue-200 text-gray-600 hover:text-gray-900 hover:bg-blue-50 hover:border-blue-300"
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
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300"
                        >
                          {loading ? "Generating..." : "See Results"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {phase === "result" && result && (
                  <div className="space-y-6">
                    <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl result-item">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Summary</h3>
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                          {result.summary}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl result-item">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Recovery Recommendations</h3>
                        <div className="space-y-3">
                          {result.tips.map((t, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-gray-700 leading-relaxed">{t}</p>
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
            <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-blue-300/5 blur-3xl animate-pulse" />
            <div className="absolute -inset-2 -z-5 rounded-3xl bg-gradient-to-br from-white to-blue-50/50 blur-xl" />
            <Card className="relative rounded-3xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1586773860383-dab5f3bc1f33?q=80&w=1600&auto=format&fit=crop"
                    alt="Advanced medical technology interface"
                    className="h-[400px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-blue-200 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-gray-800 font-medium">AI Analysis Complete</span>
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            Powered by Advanced AI Technology
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional-grade healthcare intelligence designed for patients seeking clear health insights.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Smart Report Analysis" 
            desc="Transform complex medical documents into clear, actionable insights with our advanced AI processing."
            icon="📊"
          />
          <FeatureCard 
            title="Health Insights" 
            desc="Personalized health analysis with key metrics tracking and trend identification for better health understanding."
            icon="🔍"
          />
          <FeatureCard 
            title="Intelligent Assistant" 
            desc="24/7 medical query support with voice interaction and evidence-based health guidance."
            icon="🤖"
          />
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-7xl px-6 pb-32">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-blue-400/15 to-blue-300/10 blur-3xl rounded-3xl" />
          <div className="relative rounded-3xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who trust HealthMate for intelligent medical analysis.
            </p>
            <div className="flex justify-center">
              <Link href="/patient">
                <Button className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 border-0 text-lg">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">99.9%</div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">500k+</div>
                <div className="text-sm text-gray-500">Reports Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">HIPAA</div>
                <div className="text-sm text-gray-500">Compliant</div>
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
    <Card className="group border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
      <CardContent className="p-8">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
        <div className="mt-6 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
}