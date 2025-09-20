"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";

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
  const [copySuccess, setCopySuccess] = useState(false);

  // PDF Download Function
  const downloadPDF = () => {
    if (!finalReport) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    let yPosition = margin;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const title = reportType === 'personal' ? 'Personal Health Report' : 'Professional Medical Analysis';
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Content
    doc.setFontSize(12);
    const contentLines = doc.splitTextToSize(finalReport.content, maxLineWidth);
    
    contentLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    // Recommendations
    if (finalReport.recommendations && finalReport.recommendations.length > 0) {
      yPosition += 10;
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Recommendations:', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      finalReport.recommendations.forEach((rec, idx) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        const bulletPoint = `${idx + 1}. ${rec}`;
        const recLines = doc.splitTextToSize(bulletPoint, maxLineWidth);
        recLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      });
    }
    
    // Save the PDF
    doc.save(`HealthMate_${reportType}_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setParseError("");

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        setParsing(true);
        console.log('Starting PDF processing for file:', file.name, 'Size:', file.size, 'bytes');
        
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        
        // Configure PDF.js worker with multiple fallback options
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
        } catch (workerError) {
          console.warn('Failed to load local worker, trying CDN fallback:', workerError);
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        
        console.log('📄 PDF.js version:', pdfjsLib.version);
        console.log('🔧 Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);

        const buffer = await file.arrayBuffer();
        console.log('📊 File buffer size:', buffer.byteLength, 'bytes');
        
        if (buffer.byteLength === 0) {
          throw new Error('PDF file appears to be empty or corrupted');
        }
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: new Uint8Array(buffer),
          verbosity: 0, // Reduce console noise
          stopAtErrors: false // Continue processing even with minor errors
        });
        
        const pdf = await loadingTask.promise;
        console.log('PDF loaded successfully. Pages:', pdf.numPages);
        
        let fullText = "";
        let processedPages = 0;
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            
            // Enhanced text extraction with better formatting
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const textItems = (content.items as any[]).filter(item => item.str && item.str.trim());
            
            if (textItems.length > 0) {
              // Group text items by their Y coordinate to maintain line structure
              const lines: { [key: number]: string[] } = {};
              
              textItems.forEach((item: any) => {
                const y = Math.round(item.transform[5]); // Y coordinate
                if (!lines[y]) lines[y] = [];
                lines[y].push(item.str.trim());
              });
              
              // Sort lines by Y coordinate (top to bottom)
              const sortedLines = Object.keys(lines)
                .map(y => parseInt(y))
                .sort((a, b) => b - a) // Descending order (top to bottom)
                .map(y => lines[y].join(' ').trim())
                .filter(line => line.length > 0);
              
              if (sortedLines.length > 0) {
                fullText += sortedLines.join('\n') + '\n\n';
              }
            }
            
            processedPages++;
            console.log(`Processed page ${pageNum}/${pdf.numPages}`);
            
          } catch (pageError) {
            console.warn(`Error processing page ${pageNum}:`, pageError);
            // Continue with next page instead of failing entirely
          }
        }
        
        const extractedText = fullText.trim();
        
        if (extractedText.length === 0) {
          throw new Error('No text could be extracted from this PDF. The file might be image-based or password-protected.');
        }
        
        console.log(`Successfully extracted ${extractedText.length} characters from ${processedPages}/${pdf.numPages} pages`);
        setFileText(extractedText);
        
      } catch (err) {
        console.error('PDF processing error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        
        if (errorMessage.includes('Invalid PDF')) {
          setParseError("This file appears to be corrupted or not a valid PDF. Please try a different file.");
        } else if (errorMessage.includes('No text could be extracted')) {
          setParseError("Unable to extract text from this PDF. It might be an image-based PDF or password-protected. Please try converting it to text or use a different file.");
        } else if (errorMessage.includes('worker')) {
          setParseError("PDF processing failed due to technical issues. Please try again or paste the text manually.");
        } else {
          setParseError(`Failed to read PDF: ${errorMessage}. Please try another file or paste the text manually.`);
        }
      } finally {
        setParsing(false);
      }
      return;
    }

    // Handle non-PDF files
    try {
      const text = await file.text();
      setFileText(text);
      console.log(`Successfully read text file: ${text.length} characters`);
    } catch (err) {
      console.error('Text file reading error:', err);
      setParseError("Failed to read the text file. Please ensure it's a valid text file.");
    }
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
                        📥 Download Report
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
            <div className="space-y-8 animate-fadeIn">
              {/* Celebration Header */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-green-400/20 blur-3xl animate-pulse" />
                <div className="relative">
                  <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-500 via-purple-600 to-green-500 text-white px-8 py-4 rounded-3xl shadow-2xl mb-6 transform hover:scale-105 transition-all duration-300">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                      {reportType === 'personal' ? '🎉' : '📊'}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xl">
                        {reportType === 'personal' ? 'Your Personal Health Report' : 'Professional Medical Analysis'}
                      </div>
                      <div className="text-white/80 text-sm">✅ Analysis Complete</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Generated by HealthMate AI
                    </div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div>{new Date().toLocaleDateString()}</div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <span>⏱️</span>
                      <span>Fresh Analysis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-2xl p-4 border border-blue-200/50">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Report Generation Progress</span>
                  <span className="font-bold text-green-600">100% Complete ✅</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-full rounded-full w-full animate-pulse"></div>
                </div>
              </div>

              {/* Main Report Content */}
              <Card className="border-0 bg-gradient-to-br from-white via-blue-50/40 to-purple-50/40 backdrop-blur-3xl shadow-2xl overflow-hidden transform hover:shadow-3xl transition-all duration-500">
                <div className="bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-green-500/15 p-8 border-b border-blue-200/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
                  <div className="relative flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl transform hover:rotate-12 transition-transform duration-300">
                      📋
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-2">
                        Health Analysis Summary
                      </h2>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          AI-powered insights
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Personalized recommendations
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Evidence-based
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">✓</div>
                      <div className="text-xs text-gray-500">Verified</div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-0">
                  {/* Content with enhanced formatting */}
                  <div className="p-8 bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-xl">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 border-2 border-blue-100/50 shadow-inner relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30"></div>
                      <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-20"></div>
                      
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            📄
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">Detailed Analysis Report</h3>
                          <div className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {reportType === 'personal' ? 'Patient-Friendly' : 'Clinical Format'}
                          </div>
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-6">
                            <div className="text-gray-800 leading-relaxed">
                              {finalReport.content.split('\n').map((paragraph, idx) => {
                                if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*')) {
                                  return (
                                    <div key={idx} className="flex items-start gap-3 mb-3">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="text-gray-700 leading-relaxed">
                                        {paragraph.trim().replace(/^[•\-\*]\s*/, '')}
                                      </p>
                                    </div>
                                  );
                                }
                                if (paragraph.trim()) {
                                  return (
                                    <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                                      {paragraph}
                                    </p>
                                  );
                                }
                                return <br key={idx} />;
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Report Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-8 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-2xl border border-blue-200/50">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">📊</div>
                            <div className="text-sm text-gray-600">Comprehensive</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-1">🎯</div>
                            <div className="text-sm text-gray-600">Personalized</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 mb-1">✅</div>
                            <div className="text-sm text-gray-600">Actionable</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Recommendations Section */}
              {finalReport.recommendations && finalReport.recommendations.length > 0 && (
                <Card className="border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 backdrop-blur-3xl shadow-2xl overflow-hidden transform hover:shadow-3xl transition-all duration-500">
                  <div className="bg-gradient-to-r from-emerald-500/15 via-green-500/15 to-teal-500/15 p-6 border-b border-emerald-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg transform hover:rotate-12 transition-transform duration-300">
                        🎯
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-teal-700 bg-clip-text text-transparent mb-1">
                          Key Recommendations
                        </h3>
                        <div className="flex items-center gap-2 text-emerald-600 text-sm">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          {finalReport.recommendations.length} personalized action items
                        </div>
                      </div>
                      <div className="ml-auto px-4 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
                        Priority Actions
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-8 bg-gradient-to-br from-white/90 to-emerald-50/50">
                    <div className="space-y-4">
                      {finalReport.recommendations.map((rec, idx) => (
                        <div key={idx} className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-emerald-200/50 hover:bg-white/90 hover:border-emerald-300/70 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-start gap-5">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                                {idx + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-emerald-800 font-medium text-lg leading-relaxed mb-2">{rec}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                <span className="text-emerald-600 text-sm">Recommended action</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-emerald-600 text-sm">→</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Recommendation Summary */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-emerald-100/50 via-green-100/50 to-teal-100/50 rounded-2xl border border-emerald-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                          💡
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-800">Remember</h4>
                          <p className="text-emerald-700 text-sm">These recommendations are personalized based on your health profile and should complement your healthcare provider's advice.</p>
                        </div>
                      </div>
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

              {/* Enhanced Action Buttons */}
              <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl p-8 border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                      📋
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Your Report is Ready!
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base font-medium max-w-2xl mx-auto">Choose how you'd like to use your personalized health analysis</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <Button 
                    onClick={downloadPDF}
                    className="group relative bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 hover:from-green-400 hover:via-green-500 hover:to-emerald-600 text-white font-semibold px-6 py-8 rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(34,197,94,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_16px_48px_rgba(34,197,94,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 min-h-[180px] backdrop-blur-sm"
                  >
                    {/* Professional gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 rounded-xl"></div>
                    {/* Subtle shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_ease-in-out] rounded-xl"></div>
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white/30">📥</div>
                      <span className="text-lg font-bold tracking-wide">Download PDF Report</span>
                      <span className="text-xs opacity-90 text-center leading-relaxed max-w-[180px]">Save your complete health analysis for sharing with doctors</span>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(finalReport.content);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (error) {
                        console.error('Failed to copy to clipboard:', error);
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = finalReport.content;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }
                    }}
                    className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-blue-700 hover:from-purple-400 hover:via-purple-500 hover:to-blue-600 text-white font-semibold px-6 py-8 rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(147,51,234,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_16px_48px_rgba(147,51,234,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 min-h-[180px] backdrop-blur-sm"
                  >
                    {/* Professional gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 rounded-xl"></div>
                    {/* Subtle shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_ease-in-out] rounded-xl"></div>
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      {copySuccess ? (
                        <>
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl animate-bounce backdrop-blur-sm border border-white/30">✅</div>
                          <span className="text-lg font-bold tracking-wide">Copied!</span>
                          <span className="text-xs opacity-90 text-center leading-relaxed max-w-[180px]">Report copied to clipboard</span>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white/30">📋</div>
                          <span className="text-lg font-bold tracking-wide">Copy Report Text</span>
                          <span className="text-xs opacity-90 text-center leading-relaxed max-w-[180px]">Copy to share via email or messaging apps</span>
                        </>
                      )}
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={resetWorkflow}
                    className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 hover:from-blue-400 hover:via-blue-500 hover:to-indigo-600 text-white font-semibold px-6 py-8 rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_16px_48px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 min-h-[180px] backdrop-blur-sm"
                  >
                    {/* Professional gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 rounded-xl"></div>
                    {/* Subtle shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_ease-in-out] rounded-xl"></div>
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-180 transition-all duration-500 backdrop-blur-sm border border-white/30">🔄</div>
                      <span className="text-lg font-bold tracking-wide">Start New Analysis</span>
                      <span className="text-xs opacity-90 text-center leading-relaxed max-w-[180px]">Upload another report or analyze new symptoms</span>
                    </div>
                  </Button>
                </div>
                
                {/* Success Message */}
                <div className="mt-6 p-4 bg-green-100/50 border border-green-200/50 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <span className="text-lg">🎉</span>
                    <span className="font-medium">Your health analysis is complete and ready to use!</span>
                  </div>
                </div>
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
                          <li>Your medical report will be processed by AI to provide personalized analysis</li>
                          <li>Data is sent to OpenAI for processing (third-party service)</li>
                          <li>No personal data is stored permanently by HealthMate</li>
                          <li>This service is for informational purposes only</li>
                          <li>Always consult healthcare professionals for medical decisions</li>
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