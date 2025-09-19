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
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="mb-3 w-[360px] max-w-[90vw] border-white/15 bg-white/[0.04] backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-indigo-500/20 text-indigo-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                placeholder="Ask about a medicine..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleVoice} className={listening ? "border-emerald-400 text-emerald-300" : ""}>
                      {listening ? "Stop" : "Voice"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle voice input</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={onSend}>Send</Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">This assistant provides educational information and is not a substitute for professional medical advice.</p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full h-12 px-5 shadow-[0_0_40px_rgba(99,102,241,0.35)] bg-gradient-to-r from-indigo-500/70 to-emerald-500/70 hover:from-indigo-500 hover:to-emerald-500"
      >
        {open ? "Close Assistant" : "Ask HealthMate"}
      </Button>
    </div>
  );
}