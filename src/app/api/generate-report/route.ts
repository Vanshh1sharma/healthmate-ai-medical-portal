import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { reportData, reportType } = await req.json();

    if (!reportData || !reportType) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    let generatedReport;
    
    if (reportType === "personal") {
      generatedReport = await AIService.generatePersonalReport(reportData);
    } else if (reportType === "professional") {
      generatedReport = await AIService.generateProfessionalReport(reportData);
    } else {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Add appropriate disclaimer
    const disclaimer = "**DISCLAIMER: This is an AI-generated report and should not replace professional medical advice. Please consult with qualified healthcare providers for medical decisions.**";
    
    generatedReport.content += `\n\n${disclaimer}`;

    return NextResponse.json({ report: generatedReport });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to generate report" 
    }, { status: 500 });
  }
}