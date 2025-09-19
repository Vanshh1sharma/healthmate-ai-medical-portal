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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-semibold">Doctor Dashboard</h1>
      <p className="text-muted-foreground mt-1">Generate technical summaries and verify clinical notes.</p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl md:col-span-2">
          <CardHeader>
            <CardTitle>Clinical Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste or type clinical notes here..."
              className="min-h-[180px]"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={onTechSummary} disabled={loadingA || !notes.trim()}>
                {loadingA ? "Generating..." : "Technical Summary"}
              </Button>
              <Button variant="outline" onClick={onVerify} disabled={loadingB || !notes.trim()}>
                {loadingB ? "Verifying..." : "Verify Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Technical Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Your technical summary will appear here.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {verify ? (
              <div>
                <p className="text-sm">Quality Score: <span className="font-medium">{Math.round(verify.score)}</span>/100</p>
                <div className="mt-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Issues</p>
                  <ul className="list-disc list-inside text-sm">
                    {verify.issues.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Suggestions</p>
                  <ul className="list-disc list-inside text-sm">
                    {verify.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Run verification to see issues and suggestions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}