import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const raw: string = String(text || "");

    if (!raw.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Simple heuristic scoring
    const hasAssessment = /assessment|diagnosis|impression/i.test(raw);
    const hasPlan = /plan|management|follow[- ]?up/i.test(raw);
    const hasVitals = /bp|blood pressure|hr|heart rate|rr|respiratory rate|temp|temperature|spo2/i.test(raw);
    const lengthScore = Math.min(60, Math.floor(raw.length / 20));

    let score = lengthScore;
    if (hasAssessment) score += 15;
    if (hasPlan) score += 15;
    if (hasVitals) score += 10;
    score = Math.max(0, Math.min(100, score));

    const issues: string[] = [];
    if (!hasAssessment) issues.push("Missing assessment/diagnosis section.");
    if (!hasPlan) issues.push("Missing plan/management details.");
    if (!hasVitals) issues.push("No vitals found (BP/HR/RR/Temp/SpO2).");

    const suggestions: string[] = [
      "Add a concise Assessment/Impression summarizing the case.",
      "Include an explicit Plan with medications, investigations, and follow-up.",
      "Document key vitals and abnormal lab values with dates.",
      "Use consistent units and include patient identifiers as appropriate.",
    ];

    return NextResponse.json({ score, issues, suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}