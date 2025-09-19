import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import Chatbot from "@/components/Chatbot";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HealthMate — Your AI Health Companion",
  description: "HealthMate: Modern healthcare platform with AI summaries, doctor tools, and a voice-enabled assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {/* Global Navigation */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_0_32px_rgba(16,185,129,0.4)]" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/60 to-cyan-500/60 blur-md" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">HealthMate</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300">Features</Link>
              <Link href="/patient" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300">Patient Portal</Link>
              <Link href="/doctor" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300">Doctor Tools</Link>
              <Link href="/patient" className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/25 hover:border-white/35 backdrop-blur-xl transition-all duration-300">Get Started</Link>
            </nav>
          </div>
        </header>
        
        {children}
        <VisualEditsMessenger />
        {/* Global floating chatbot visible on all pages */}
        <Chatbot />
      </body>
    </html>
  );
}