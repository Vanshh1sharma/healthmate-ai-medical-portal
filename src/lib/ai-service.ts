import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MedicalAnalysis {
  keyFindings: string[];
  potentialConditions: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  questions: string[];
}

export interface ReportData {
  patientResponses: Record<string, string>;
  originalReport: string;
  analysis: MedicalAnalysis;
}

export interface GeneratedReport {
  content: string;
  recommendations: string[];
}

export class AIService {
  // Analyze medical report and extract key information
  static async analyzeReport(reportText: string): Promise<MedicalAnalysis> {
    try {
      const prompt = `
        You are a medical AI assistant analyzing a patient's medical report. 
        Extract key information and generate intelligent questions.
        
        Report text: ${reportText}
        
        Analyze the report and return a JSON response with:
        - keyFindings: Array of key medical findings from the report
        - potentialConditions: Array of possible conditions based on the findings
        - urgencyLevel: "low", "medium", or "high" based on the severity
        - questions: Array of 3-5 relevant questions to ask the patient to better understand their condition
        
        Make questions specific to the medical issues mentioned in the report.
        Questions should help gather additional context about symptoms, duration, triggers, etc.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error analyzing report:", error);
      throw new Error("Failed to analyze medical report");
    }
  }

  // Generate personal report (simplified language)
  static async generatePersonalReport(reportData: ReportData): Promise<GeneratedReport> {
    try {
      const prompt = `
        Generate a personal medical report for a patient in simple, easy-to-understand language.
        
        Original Report: ${reportData.originalReport}
        Analysis: ${JSON.stringify(reportData.analysis)}
        Patient Responses: ${JSON.stringify(reportData.patientResponses)}
        
        Create a comprehensive report that includes:
        1. What the problem is (in simple terms)
        2. What might be causing it
        3. Recommended treatments (in simple language)
        4. Practical advice for getting better faster
        5. When to seek immediate medical attention
        
        Use everyday language that anyone can understand. Avoid medical jargon.
        Be supportive and encouraging in tone.
        
        Return JSON with:
        - content: The full report text
        - recommendations: Array of practical health advice
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating personal report:", error);
      throw new Error("Failed to generate personal report");
    }
  }

  // Generate professional report (medical terminology)
  static async generateProfessionalReport(reportData: ReportData): Promise<GeneratedReport> {
    try {
      const prompt = `
        Generate a professional medical report using proper medical terminology for healthcare providers.
        
        Original Report: ${reportData.originalReport}
        Analysis: ${JSON.stringify(reportData.analysis)}
        Patient Responses: ${JSON.stringify(reportData.patientResponses)}
        
        Create a comprehensive professional report that includes:
        1. Clinical assessment and findings
        2. Differential diagnosis considerations
        3. Recommended diagnostic procedures (if applicable)
        4. Treatment protocol suggestions
        5. Prognosis and follow-up recommendations
        
        Use appropriate medical terminology and maintain professional clinical language.
        Include relevant clinical indicators and evidence-based recommendations.
        
        Return JSON with:
        - content: The full professional report text
        - recommendations: Array of clinical recommendations
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating professional report:", error);
      throw new Error("Failed to generate professional report");
    }
  }
}