"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm HealthMate. Ask me about your medicines. I can explain usage, side effects, and precautions." },
  ]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
        setQuery(text);
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const handleVoice = () => {
    if (!recognitionRef.current) return;
    if (!listening) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const answer = (q: string) => {
    const lower = q.toLowerCase();
    let resp = "I can help explain how to take medicines, possible side effects, and precautions. Please share the drug name and your question.";
    if (lower.includes("paracetamol") || lower.includes("acetaminophen")) {
      resp = "Paracetamol (acetaminophen) is used for pain/fever. Typical adult dose is 500–1000 mg every 6–8 hours as needed. Do not exceed 3,000 mg/day without doctor advice. Avoid combining with alcohol. Common side effects are nausea and rash. This is educational advice, not a medical diagnosis.";
    } else if (lower.includes("ibuprofen")) {
      resp = "Ibuprofen is an NSAID for pain/inflammation. Take with food. Typical adult dose 200–400 mg every 6–8 hours. Avoid if you have stomach ulcers, kidney disease, or are in late pregnancy. Watch for stomach pain or dark stools. Educational only.";
    } else if (lower.includes("antibiotic")) {
      resp = "For antibiotics, complete the full course even if you feel better. Do not share antibiotics. If you develop rash, swelling, or trouble breathing, seek urgent care. Avoid alcohol with metronidazole. Educational only.";
    }
    return resp;
  };

  const onSend = () => {
    if (!query.trim()) return;
    const userMsg = { role: "user" as const, content: query.trim() };
    const botText = answer(query.trim());
    const botMsg = { role: "assistant" as const, content: botText };
    setMessages((m) => [...m, userMsg, botMsg]);
    setQuery("");
    speak(botText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-[420px] max-w-[90vw] animate-fadeIn">
          <Card className="border-0 bg-gradient-to-br from-white via-blue-50/40 to-purple-50/40 backdrop-blur-3xl shadow-2xl overflow-hidden transform hover:shadow-3xl transition-all duration-500">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-green-500/15 p-4 border-b border-blue-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-green-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                  🤖
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                    HealthMate Assistant
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>AI-powered medical guidance</span>
                  </div>
                </div>
                <div className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Online
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              {/* Enhanced Messages Container */}
              <div className="p-4 bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-xl">
                <div className="max-h-80 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="flex items-start gap-2 max-w-[85%]">
                        {m.role === "assistant" && (
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
                            🤖
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-lg transform hover:scale-105 transition-all duration-200 ${
                          m.role === "user" 
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_8px_32px_rgba(59,130,246,0.35)]" 
                            : "bg-gradient-to-r from-green-50 to-emerald-50 text-gray-800 border border-green-200/50 shadow-[0_8px_32px_rgba(34,197,94,0.15)]"
                        }`}>
                          {m.content}
                        </div>
                        {m.role === "user" && (
                          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
                            👤
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Input Area */}
              <div className="p-4 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-green-50/50 border-t border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Ask me about medicines, side effects, dosages..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onSend()}
                      className="bg-white/80 backdrop-blur-xl border-blue-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 pr-12"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-400 text-xs">💬</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleVoice} 
                            className={`border-2 transition-all duration-300 ${
                              listening 
                                ? "border-green-400 text-green-600 bg-green-50 animate-pulse" 
                                : "border-blue-200 text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {listening ? (
                              <span className="flex items-center gap-1">
                                🎙️ <span className="text-xs">Listening...</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                🎤 <span className="text-xs">Voice</span>
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                          {listening ? "Click to stop voice input" : "Click to use voice input"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <Button 
                    onClick={onSend}
                    disabled={!query.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold px-6 py-2 rounded-xl border-0 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      <span>Send</span>
                      <span className="text-lg">📤</span>
                    </span>
                  </Button>
                </div>

                {/* Enhanced Disclaimer */}
                <div className="mt-3 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <div className="text-amber-600 text-sm flex-shrink-0">⚠️</div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      This AI assistant provides educational information only and is not a substitute for professional medical advice. Always consult healthcare providers for medical decisions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Toggle Button */}
      <Button
        onClick={() => setOpen((o) => !o)}
        className="group relative bg-gradient-to-r from-blue-500 via-purple-600 to-green-500 hover:from-blue-400 hover:to-green-400 text-white font-semibold rounded-full h-14 px-6 shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_48px_rgba(59,130,246,0.5)] transition-all duration-500 transform hover:scale-110 border-0"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 flex items-center gap-3">
          <div className={`w-8 h-8 bg-white/20 rounded-full flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-180' : 'group-hover:rotate-12'}`}>
            {open ? '✕' : '🤖'}
          </div>
          <span className="font-bold">
            {open ? "Close Assistant" : "Ask HealthMate"}
          </span>
        </span>
        {!open && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
        )}
      </Button>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
}