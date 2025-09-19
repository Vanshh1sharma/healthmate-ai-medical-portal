import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();
    const raw: string = String(text || "");
    const modeStr: string = (mode === "doctor" ? "doctor" : "patient");

    if (!raw.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Very simple heuristic summary generator
    const sentences = raw
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);

    const take = sentences.slice(0, 3).join(" ");

    const technical = `Technical Overview: ${take}`;
    const friendly = `Summary: ${take}`;

    // Extract some mock insights
    const numbers = Array.from(raw.matchAll(/(\d+\.?\d*)/g)).map((m) => Number(m[1])).slice(0, 5);

    const insights = [
      { label: "Key Values Found", value: numbers.length ? numbers.join(", ") : "n/a" },
      { label: "Report Length", value: `${raw.length} chars`, trend: raw.length > 400 ? "long" : "short" },
      { label: "Sentence Count", value: String(sentences.length) },
    ];

    const summary = modeStr === "doctor"
      ? `${technical}\n\nImpression: Based on provided notes, consider differential refinement and verify against labs and vitals.`
      : `${friendly}\n\nWhat it means: This simplifies your report into the most important points. Please consult a clinician for decisions.`;

    return NextResponse.json({ summary, insights });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}