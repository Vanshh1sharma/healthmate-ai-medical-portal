import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import Chatbot from "@/components/Chatbot";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HealthMate — Your AI Health Companion",
  description: "HealthMate: Modern healthcare platform with AI summaries and voice-enabled assistant for patients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-blue-200">
          <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img 
                src="/healthmate-new-logo.png" 
                alt="HealthMate Logo" 
                className="h-12 w-auto object-contain hover:scale-105 transition-all duration-300"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300">Features</Link>
              <Link href="/patient" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300">Patient Portal</Link>
              <Link href="/patient" className="px-4 py-2 text-sm font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl border border-blue-300 hover:border-blue-400 backdrop-blur-xl transition-all duration-300">Get Started</Link>
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