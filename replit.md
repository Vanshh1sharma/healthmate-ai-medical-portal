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
- ✅ Successfully imported fresh clone from GitHub and configured for Replit environment
- ✅ Installed dependencies with --legacy-peer-deps for React 19 compatibility  
- ✅ Fixed PDF.js SSR compatibility issue by making it dynamically imported
- ✅ Configured Next.js headers for iframe compatibility and cross-origin requests
- ✅ Set up autoscale deployment configuration
- ✅ Created workflow for development server on port 5000 with proper host binding
- ✅ Updated allowedDevOrigins to include Replit-specific domains and current Replit instance
- ✅ Fixed TypeScript compilation error in ErrorReporter component (useRef typing)
- ✅ Enhanced with AI-powered interactive medical analysis workflow:
  - Smart question generation based on uploaded reports
  - Interactive Q&A with HealthMate Sathi
  - Personal and professional report generation
  - Privacy consent modal and data processing notice
  - Comprehensive error handling with fallback mechanisms
  - Styled AI disclaimers and warnings
- ✅ Integrated Google Gemini AI (not OpenAI) for medical analysis and report generation
- ✅ All pages (home and patient portal) are working successfully
- ✅ Development server running successfully on port 5000 with proper configuration
- ⚠️ GEMINI_API_KEY needs to be configured as a secret for AI features to work in production

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
- Status: ✅ Running successfully in Replit environment (AI features need GEMINI_API_KEY configuration)