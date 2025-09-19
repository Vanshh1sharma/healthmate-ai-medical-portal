import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { question, language = 'en', context = 'medical_chat' } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const isHindi = language === 'hi';
    
    const systemPrompt = isHindi
      ? `आप एक सहायक AI स्वास्थ्य सहायक हैं जो HealthMate नाम से जाना जाता है। आप दवाओं, साइड इफेक्ट्स, खुराक और सामान्य स्वास्थ्य सवालों के बारे में शैक्षिक जानकारी प्रदान करते हैं।

निर्देश:
- हमेशा हिंदी में जवाब दें
- सरल और समझने योग्य भाषा का उपयोग करें
- चिकित्सा सलाह के लिए हमेशा डॉक्टर से सलाह लेने की सलाह दें
- यदि आप कुछ नहीं जानते हैं, तो स्वीकार करें
- दोस्ताना और सहायक टोन बनाए रखें
- दवाओं के नाम अंग्रेजी में भी दे सकते हैं`
      : `You are a helpful AI health assistant named HealthMate. You provide educational information about medicines, side effects, dosages, and general health questions.

Instructions:
- Always respond in English
- Use simple, easy-to-understand language
- Always recommend consulting doctors for medical advice
- If you don't know something, admit it
- Maintain a friendly and helpful tone
- Focus on educational information, not diagnosis`;

    const userPrompt = isHindi
      ? `स्वास्थ्य प्रश्न: ${question}\n\nकृपया इस प्रश्न का उत्तर हिंदी में दें। यदि यह दवाओं के बारे में है, तो उपयोग, खुराक, और सावधानियों के बारे में बताएं।`
      : `Health question: ${question}\n\nPlease answer this question in English. If it's about medicines, include information about usage, dosage, and precautions.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      const fallbackMessage = isHindi
        ? 'माफ करें, मैं अभी आपकी मदद नहीं कर सकता। कृपया बाद में कोशिश करें।'
        : 'Sorry, I cannot help you right now. Please try again later.';
      
      return NextResponse.json({ response: fallbackMessage });
    }

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Chatbot API error:', error);
    
    const errorMessage = 'Sorry, I encountered an error. Please try again.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}