# HealthMate - AI Health Companion

## Project Overview
HealthMate is a modern healthcare platform built with Next.js, featuring AI-powered medical report summaries, doctor tools, and a voice-enabled assistant. The application provides both patient and doctor dashboards with intelligent health analysis capabilities.

## Architecture
- **Frontend**: Next.js 15.3.5 with TypeScript
- **Styling**: Tailwind CSS with custom UI components
- **Components**: Radix UI, Framer Motion for animations
- **APIs**: Built-in Next.js API routes for report analysis
- **Deployment**: Configured for Replit autoscale deployment

## Key Features
- AI-powered medical report summarization
- Patient and doctor dashboard interfaces
- Voice-enabled chatbot assistant
- File upload for medical reports (PDF/images)
- Medical note verification system
- Responsive design with dark theme

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
- Imported from GitHub and configured for Replit environment
- Removed Turbopack due to build compatibility issues
- Configured Next.js headers for iframe compatibility
- Set up autoscale deployment configuration
- Created workflow for development server on port 5000

## Development Environment
- Node.js v20.19.3
- Package manager: npm (with legacy peer deps for React 19 compatibility)
- Build system: Next.js with TypeScript compilation