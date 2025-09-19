# HealthMate - AI Health Companion

## Project Overview
HealthMate is a modern healthcare platform built with Next.js, featuring AI-powered medical report summaries and a voice-enabled assistant. The application provides a patient dashboard with intelligent health analysis capabilities.

## Architecture
- **Frontend**: Next.js 15.3.5 with TypeScript
- **Styling**: Tailwind CSS with custom UI components
- **Components**: Radix UI, Framer Motion for animations
- **APIs**: Built-in Next.js API routes for report analysis
- **Deployment**: Configured for Replit autoscale deployment

## Key Features
- AI-powered medical report summarization
- Patient dashboard interface
- Voice-enabled chatbot assistant
- File upload for medical reports (PDF/images)
- Health insights and recommendations
- Responsive design with white and blue theme

## Development Setup
The project is configured to run on port 5000 in the Replit environment:
- Development server: `npm run dev -- --hostname 0.0.0.0 --port 5000`
- Build command: `npm run build`
- Production server: `npm start`

## Configuration Notes
- Next.js configured for Replit environment with proper headers
- Deployment set to autoscale for stateless operation
- Dependencies include comprehensive UI library (Radix UI, Heroicons)
- Uses modern React 19 with TypeScript support

## Recent Changes (September 19, 2025)
- ✅ Fresh clone imported from GitHub successfully
- ✅ Installed all project dependencies with --legacy-peer-deps for React 19 compatibility
- ✅ Verified Next.js configuration for Replit environment (already properly configured)
- ✅ Set up HealthMate workflow running on port 5000 with webview output
- ✅ Configured autoscale deployment for production
- ✅ Application running successfully with proper compilation and routing
- ✅ All core features available (awaiting AI API key configuration for full functionality)
- ✅ GEMINI_API_KEY configured successfully - AI features now fully operational
- ✅ Logo size increased for better visibility and branding

## AI Features
- **Intelligent Report Analysis**: Extracts key findings and generates relevant questions
- **Interactive Q&A**: HealthMate Sathi asks smart questions based on report content
- **Dual Report Types**: 
  - Personal: Simple language with practical advice for patients
  - Professional: Medical terminology for healthcare providers
- **Privacy Protection**: Consent modal and data processing transparency
- **Error Resilience**: Robust fallback mechanisms for AI service failures

## Development Environment
- Node.js v20.19.3
- Package manager: npm (with legacy peer deps for React 19 compatibility)
- Build system: Next.js with TypeScript compilation
- Development server: Configured for port 5000 with host 0.0.0.0
- AI Service: Google Gemini AI integration for medical analysis
- Status: ✅ Running successfully in Replit environment with full AI functionality