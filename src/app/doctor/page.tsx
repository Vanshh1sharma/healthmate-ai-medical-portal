"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function DoctorDashboard() {
  const [notes, setNotes] = useState("");
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [verify, setVerify] = useState<{ score: number; issues: string[]; suggestions: string[] } | null>(null);

  const onTechSummary = async () => {
    if (!notes.trim()) return;
    setLoadingA(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes, mode: "doctor" }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } finally {
      setLoadingA(false);
    }
  };

  const onVerify = async () => {
    if (!notes.trim()) return;
    setLoadingB(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes }),
      });
      const data = await res.json();
      setVerify(data);
    } finally {
      setLoadingB(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden style={{
        background: "radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(1000px 500px at 90% 20%, rgba(16,185,129,0.12), transparent 60%)",
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 70%)"
      }} />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />
      
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            Doctor Dashboard
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Professional medical tools for generating technical summaries and verifying clinical documentation with AI precision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl md:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-2xl">📋</span>
                Clinical Notes Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter or paste clinical notes, patient records, or medical documentation here..."
              className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 text-base"
            />
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={onTechSummary} 
                disabled={loadingA || !notes.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold px-6 py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:opacity-50"
              >
                {loadingA ? "🔄 Processing..." : "📊 Generate Technical Summary"}
              </Button>
              <Button 
                variant="outline" 
                onClick={onVerify} 
                disabled={loadingB || !notes.trim()}
                className="border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl rounded-xl px-6 py-3 transition-all duration-300 font-semibold disabled:opacity-50"
              >
                {loadingB ? "🔄 Analyzing..." : "🔍 Verify & Quality Check"}
              </Button>
            </div>
          </CardContent>
        </Card>

          <Card className="border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Technical Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-white/80">{summary}</p>
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-300 font-medium">✅ Technical Analysis Complete</p>
                    <p className="text-xs text-blue-200/80 mt-1">Professional-grade summary generated for clinical documentation.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🧠</div>
                  <p className="text-white/60">Technical summary with medical insights will be generated here after processing your clinical notes.</p>
                </div>
              )}
          </CardContent>
        </Card>

          <Card className="border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Quality Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {verify ? (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80">Quality Score</span>
                      <span className={`text-2xl font-bold ${
                        Math.round(verify.score) >= 80 ? 'text-emerald-400' : 
                        Math.round(verify.score) >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(verify.score)}/100
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          Math.round(verify.score) >= 80 ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 
                          Math.round(verify.score) >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${Math.round(verify.score)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        Issues Found ({verify.issues.length})
                      </h4>
                      <ul className="space-y-2">
                        {verify.issues.map((i, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-red-200/80">
                            <span className="text-red-400 mt-1">•</span>
                            {i}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                      <h4 className="text-emerald-300 font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        Improvement Suggestions ({verify.suggestions.length})
                      </h4>
                      <ul className="space-y-2">
                        {verify.suggestions.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-emerald-200/80">
                            <span className="text-emerald-400 mt-1">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔬</div>
                  <p className="text-white/60">Run quality verification to analyze your clinical notes for accuracy, completeness, and professional standards.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}