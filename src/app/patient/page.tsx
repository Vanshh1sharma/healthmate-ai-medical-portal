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
        body: JSON.stringify({ text: fileText }),
      });
      const data = await res.json();
      setSummary(data.summary);
      setInsights(data.insights || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden style={{
        background: "radial-gradient(1200px 600px at 80% -10%, rgba(59,130,246,0.1), transparent 60%), radial-gradient(1000px 500px at -10% 20%, rgba(147,197,253,0.08), transparent 60%)",
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 70%)"
      }} />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            Patient Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your health reports and receive AI-powered summaries with personalized insights and recommendations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Upload Medical Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="relative">
              <Input type="file" accept=".pdf,.txt,.md,.json,.csv,.log,.doc,.docx" onChange={(e) => onFile(e.target.files?.[0])} 
                className="bg-white border-blue-200 text-gray-900 file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 hover:bg-blue-50 transition-all duration-300" />
            </div>
            {fileName && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-sm text-gray-700">📄 Selected: <span className="text-gray-900 font-medium">{fileName}</span>{parsing ? " – parsing PDF…" : ""}</p>
              </div>
            )}
            {parseError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            )}
            <Textarea
              value={fileText}
              onChange={(e) => setFileText(e.target.value)}
              placeholder="Or paste your report text here..."
              className="min-h-[160px] bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
            />
            <Button 
              onClick={onSummarize} 
              disabled={loading || parsing || !fileText.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "🔄 Analyzing..." : "✨ Generate AI Summary"}
            </Button>
          </CardContent>
        </Card>

          <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">AI-Generated Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{summary}</p>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">✅ Analysis Complete</p>
                    <p className="text-xs text-blue-600 mt-1">This summary was generated using advanced AI to help you understand your medical report better.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-gray-500">Your AI-generated summary will appear here once you upload and analyze your medical report.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

        {insights.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Key Insights</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((i, idx) => (
                <Card key={idx} className="group border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{i.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{i.value}</p>
                    {i.trend && (
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                        <p className="text-xs text-gray-600">Trend: <span className="text-blue-600">{i.trend}</span></p>
                      </div>
                    )}
                    <div className="mt-4 w-8 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}