"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MedicalAnalysis {
  keyFindings: string[];
  potentialConditions: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  questions: string[];
}

interface GeneratedReport {
  content: string;
  recommendations: string[];
}

export default function PatientDashboard() {
  const [fileText, setFileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [parsing, setParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>("");
  
  // New state for AI workflow
  const [currentStep, setCurrentStep] = useState<'profile' | 'upload' | 'questions' | 'report-type' | 'final-report'>('profile');
  const [analysis, setAnalysis] = useState<MedicalAnalysis | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [reportType, setReportType] = useState<'personal' | 'professional' | null>(null);
  const [finalReport, setFinalReport] = useState<GeneratedReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [globalError, setGlobalError] = useState<string>("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setParseError("");

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        setParsing(true);
        
        // Dynamically import PDF.js only when needed and on client side
        const pdfjsLib = await import("pdfjs-dist");
        
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

  // Show consent modal before analysis
  const startAnalysis = () => {
    if (!fileText.trim()) return;
    if (!consentGiven) {
      setShowConsentModal(true);
      return;
    }
    analyzeReport();
  };

  // Analyze report and start Q&A workflow
  const analyzeReport = async () => {
    setLoading(true);
    setGlobalError("");
    setParseError("");
    try {
      const res = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fileText }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Validate that we got proper analysis data
      if (!data.analysis || !data.analysis.questions || data.analysis.questions.length === 0) {
        throw new Error("Invalid analysis received from server");
      }
      
      setAnalysis(data.analysis);
      setCurrentStep('questions');
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error analyzing report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze report';
      setGlobalError(errorMessage);
      setParseError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer submission for current question
  const submitAnswer = () => {
    if (!analysis || !currentAnswer.trim()) return;
    
    const question = analysis.questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [question]: currentAnswer }));
    setCurrentAnswer("");
    
    if (currentQuestionIndex < analysis.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep('report-type');
    }
  };

  // Generate final report
  const generateFinalReport = async (type: 'personal' | 'professional') => {
    if (!analysis) return;
    
    setReportType(type);
    setGeneratingReport(true);
    setGlobalError("");
    
    try {
      const reportData = {
        patientResponses: answers,
        originalReport: fileText,
        analysis: analysis
      };
      
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportData, reportType: type }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.report || !data.report.content) {
        throw new Error("Invalid report received from server");
      }
      
      setFinalReport(data.report);
      setCurrentStep('final-report');
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setGlobalError(errorMessage);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Reset workflow
  const resetWorkflow = () => {
    setCurrentStep('profile');
    setAnalysis(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCurrentAnswer("");
    setReportType(null);
    setFinalReport(null);
    setFileText("");
    setFileName("");
    setParseError("");
    setGlobalError("");
    setShowConsentModal(false);
    setConsentGiven(false);
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
            {currentStep === 'profile' ? 'Patient Profile' : 'Patient Portal'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {currentStep === 'profile' 
              ? 'Review your health history and access your latest medical reports.' 
              : 'Upload your health reports and receive AI-powered summaries with personalized insights and recommendations.'}
          </p>
        </div>

        <div className="space-y-8">
          {/* Global Error Display */}
          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h4 className="text-red-800 font-medium">Error</h4>
                  <p className="text-red-700 text-sm">{globalError}</p>
                </div>
                <button 
                  onClick={() => setGlobalError("")}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* Profile Step */}
          {currentStep === 'profile' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Summary */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        👤
                      </div>
                      Patient Health Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Last Health Issue
                        </h4>
                        <p className="text-green-700 font-medium">Blood pressure monitoring</p>
                        <p className="text-green-600 text-sm mt-1">Analyzed on March 15, 2024</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Reports Generated
                        </h4>
                        <p className="text-blue-700 font-medium">3 comprehensive reports</p>
                        <p className="text-blue-600 text-sm mt-1">Latest: Personal & Professional</p>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Recent Health Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-amber-800 font-medium">Blood pressure analysis completed</p>
                            <p className="text-amber-600 text-xs">March 15, 2024 • Professional report generated</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-blue-800 font-medium">Routine checkup report reviewed</p>
                            <p className="text-blue-600 text-xs">March 10, 2024 • Personal report generated</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-white backdrop-blur-2xl shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-purple-700">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => setCurrentStep('upload')}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300"
                    >
                      📄 Upload New Report
                    </Button>
                    
                    {finalReport && (
                      <Button 
                        onClick={() => {
                          const blob = new Blob([finalReport.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `HealthMate_Report_${new Date().toLocaleDateString()}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(34,197,94,0.35)] hover:shadow-[0_12px_48px_rgba(34,197,94,0.45)] transition-all duration-300"
                      >
                        📥 Download Latest Report
                      </Button>
                    )}
                    
                    <div className="pt-2 border-t border-purple-200">
                      <p className="text-purple-600 text-sm mb-2 font-medium">Health Insights</p>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-purple-700 text-xs">
                          🎯 Your last blood pressure reading showed normal ranges. Continue monitoring as recommended.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Upload Medical Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input type="file" accept=".pdf,.txt,.md,.json,.csv,.log" onChange={(e) => onFile(e.target.files?.[0])} 
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
                    disabled={loading || parsing}
                    className="min-h-[160px] bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                  />
                  <Button 
                    onClick={startAnalysis} 
                    disabled={loading || parsing || !fileText.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? "🔄 Analyzing..." : "✨ Analyze Report with HealthMate Sathi"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">HealthMate Sathi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className="text-gray-500">Hello! I'm your HealthMate Sathi. Upload your medical report and I'll ask you some questions to better understand your condition, then create a personalized report just for you.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Questions Step */}
          {currentStep === 'questions' && analysis && (
            <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  HealthMate Sathi Questions ({currentQuestionIndex + 1} of {analysis.questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-800 font-medium mb-2">🤖 HealthMate Sathi asks:</p>
                  <p className="text-gray-800">{analysis.questions[currentQuestionIndex]}</p>
                </div>
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Please share your answer here..."
                  className="min-h-[120px] bg-white border-blue-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
                <div className="flex gap-3">
                  <Button 
                    onClick={submitAnswer} 
                    disabled={!currentAnswer.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:opacity-50"
                  >
                    {currentQuestionIndex < analysis.questions.length - 1 ? "Next Question →" : "Complete Q&A →"}
                  </Button>
                  <Button 
                    onClick={resetWorkflow}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Start Over
                  </Button>
                </div>
                
                {/* Progress indicator */}
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((currentQuestionIndex + 1) / analysis.questions.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Type Selection Step */}
          {currentStep === 'report-type' && (
            <Card className="border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  Choose Your Report Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all duration-300 cursor-pointer" 
                        onClick={() => generateFinalReport('personal')}>
                    <CardContent className="p-6">
                      <div className="text-center space-y-3">
                        <div className="text-3xl">👤</div>
                        <h3 className="text-lg font-bold text-green-700">Personal Report</h3>
                        <p className="text-sm text-gray-600">Easy-to-understand explanation of your health condition with practical advice and simple language.</p>
                        <p className="text-xs text-green-600">Perfect for understanding your health at home</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all duration-300 cursor-pointer" 
                        onClick={() => generateFinalReport('professional')}>
                    <CardContent className="p-6">
                      <div className="text-center space-y-3">
                        <div className="text-3xl">👨‍⚕️</div>
                        <h3 className="text-lg font-bold text-purple-700">Professional Report</h3>
                        <p className="text-sm text-gray-600">Medical terminology and clinical recommendations suitable for sharing with doctors and healthcare providers.</p>
                        <p className="text-xs text-purple-600">Perfect for doctor consultations</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-4 text-center">
                  <Button 
                    onClick={resetWorkflow}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Start Over
                  </Button>
                </div>
                
                {generatingReport && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                    <p className="text-blue-700">🔄 Generating your report... This may take a moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Final Report Step */}
          {currentStep === 'final-report' && finalReport && (
            <div className="space-y-8">
              {/* Report Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg mb-4">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    {reportType === 'personal' ? '👤' : '👨‍⚕️'}
                  </div>
                  <span className="font-bold text-lg">
                    {reportType === 'personal' ? 'Personal Health Report' : 'Professional Medical Report'}
                  </span>
                </div>
                <p className="text-gray-600">Generated by HealthMate AI • {new Date().toLocaleDateString()}</p>
              </div>

              {/* Main Report Content */}
              <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-blue-200/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                      📋
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Health Analysis Summary
                      </h2>
                      <p className="text-gray-600 text-sm">AI-powered medical insights and recommendations</p>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-8">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-blue-100/50 shadow-inner">
                    <div className="prose prose-lg max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium tracking-wide">
                        {finalReport.content}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations Section */}
              {finalReport.recommendations && finalReport.recommendations.length > 0 && (
                <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-2xl shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-emerald-700 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                        ✅
                      </div>
                      Key Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {finalReport.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all duration-300">
                          <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-emerald-800 font-medium leading-relaxed flex-1">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Disclaimer */}
              <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-2xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-lg">
                      ⚠️
                    </div>
                    <div className="flex-1">
                      <h4 className="text-amber-800 font-bold mb-2">Important Medical Disclaimer</h4>
                      <p className="text-amber-700 text-sm leading-relaxed">
                        This AI-generated report is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. 
                        Always consult with qualified healthcare providers for medical decisions and follow their recommendations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => {
                    const blob = new Blob([finalReport.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `HealthMate_${reportType}_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold px-8 py-4 rounded-2xl border-0 shadow-[0_8px_32px_rgba(34,197,94,0.35)] hover:shadow-[0_12px_48px_rgba(34,197,94,0.45)] transition-all duration-300 text-lg"
                >
                  📥 Download Report
                </Button>
                <Button 
                  onClick={() => navigator.clipboard.writeText(finalReport.content)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-2xl border-0 shadow-[0_8px_32px_rgba(147,51,234,0.35)] hover:shadow-[0_12px_48px_rgba(147,51,234,0.45)] transition-all duration-300 text-lg"
                >
                  📋 Copy to Clipboard
                </Button>
                <Button 
                  onClick={resetWorkflow}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-2xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 text-lg"
                >
                  🔄 New Analysis
                </Button>
              </div>
            </div>
          )}
          
          {/* Privacy Consent Modal */}
          {showConsentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="max-w-lg mx-4 border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-2xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Privacy & Data Processing Notice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="text-yellow-600 mr-3 mt-1">⚠️</div>
                      <div>
                        <h4 className="text-yellow-800 font-medium mb-2">Important Privacy Information</h4>
                        <ul className="text-yellow-700 text-sm space-y-2">
                          <li>• Your medical report will be processed by AI to provide personalized analysis</li>
                          <li>• Data is sent to OpenAI for processing (third-party service)</li>
                          <li>• No personal data is stored permanently by HealthMate</li>
                          <li>• This service is for informational purposes only</li>
                          <li>• Always consult healthcare professionals for medical decisions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    By proceeding, you acknowledge that you understand how your data will be processed and 
                    consent to the AI analysis of your medical information.
                  </p>
                  
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setConsentGiven(true);
                        setShowConsentModal(false);
                        analyzeReport();
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl flex-1"
                    >
                      I Consent - Continue Analysis
                    </Button>
                    <Button
                      onClick={() => setShowConsentModal(false)}
                      variant="outline"
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}