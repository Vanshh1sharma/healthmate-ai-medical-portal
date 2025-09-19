"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as pdfjsLib from "pdfjs-dist";

export default function PatientDashboard() {
  const [fileText, setFileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [insights, setInsights] = useState<{ label: string; value: string; trend?: string }[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parsing, setParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>("");

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setParseError("");

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        setParsing(true);
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;

        const buffer = await file.arrayBuffer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const strings = (content.items as any[]).map((it) => (it.str ?? ""));
          fullText += strings.join(" ") + "\n\n";
        }
        setFileText(fullText.trim());
      } catch (err) {
        setParseError("Failed to read PDF. Please try another file or paste the text.");
      } finally {
        setParsing(false);
      }
      return;
    }

    const text = await file.text();
    setFileText(text);
  };

  const onSummarize = async () => {
    if (!fileText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fileText, mode: "patient" }),
      });
      const data = await res.json();
      setSummary(data.summary);
      setInsights(data.insights || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-semibold">Patient Dashboard</h1>
      <p className="text-muted-foreground mt-1">Upload a health report and get an AI summary with insights.</p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Upload Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept=".pdf,.txt,.md,.json,.csv,.log,.doc,.docx" onChange={(e) => onFile(e.target.files?.[0])} />
            {fileName && (
              <p className="text-xs text-muted-foreground">Selected: {fileName}{parsing ? " – parsing PDF…" : ""}</p>
            )}
            {parseError && (
              <p className="text-xs text-destructive">{parseError}</p>
            )}
            <Textarea
              value={fileText}
              onChange={(e) => setFileText(e.target.value)}
              placeholder="Or paste your report text here..."
              className="min-h-[160px]"
            />
            <Button onClick={onSummarize} disabled={loading || parsing || !fileText.trim()}>
              {loading ? "Summarizing..." : "Generate Summary"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Your summary will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((i, idx) => (
          <Card key={idx} className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base">{i.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{i.value}</p>
              {i.trend && <p className="text-xs text-muted-foreground mt-1">Trend: {i.trend}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}