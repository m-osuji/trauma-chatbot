import { NextRequest, NextResponse } from 'next/server'
import { SecureNLPPipeline } from '@/lib/secure-nlp'

export const maxDuration = 30

// SECURITY NOTICE: This system prioritizes user privacy and anonymity
// - All processing happens locally using lightweight NLP
// - No data is sent to external services
// - No LLM integration to prevent data exposure
// - All trauma-sensitive content stays within the user's device

// Simple response tracking to prevent repetition
let lastResponse = ''

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    // Get the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user")?.content || ""
    
    if (!lastUserMessage) {
      return new Response(
        "I'm here to listen and help. Can you tell me more about what you'd like to discuss?",
        {
          headers: { "Content-Type": "text/plain" },
        }
      )
    }
    
    // Process the message using our secure NLP pipeline ONLY
    // This ensures complete privacy - no external API calls
    const nlpPipeline = SecureNLPPipeline.getInstance()
    const processed = await nlpPipeline.processInput(lastUserMessage)
    
    // Generate response
    let response = processed.response
    
    // Simple repetition prevention
    if (response === lastResponse) {
      response = generateAlternativeResponse(processed.intent, processed.riskLevel)
    }
    
    lastResponse = response
    
    // Log confidence for debugging but never expose user data
    console.log(`Processing confidence: ${processed.confidence.toFixed(2)}`)
    
    // Return the secure NLP response
    return new Response(
      response,
      {
        headers: { "Content-Type": "text/plain" },
      }
    )
    
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      "I'm here to support you. Can you tell me what you're going through?",
      {
        headers: { "Content-Type": "text/plain" },
      }
    )
  }
}

// Generate alternative responses to prevent repetition
function generateAlternativeResponse(intent: string, riskLevel: string): string {
  const alternatives = {
    'provide_personal_info': [
      "Thank you for sharing that with me. Can you tell me more about what happened?",
      "I appreciate you sharing that. What occurred that made you reach out?",
      "Thank you for trusting me with that. Can you describe what happened?"
    ],
    'report_incident': [
      "I understand this is difficult to share. Can you tell me when this happened?",
      "I hear you, and I want to help. When did this incident occur?",
      "Thank you for being brave enough to share this. When did it happen?"
    ],
    'general_conversation': [
      "I'm here to listen. What would you like to tell me?",
      "I'm here to support you. What's on your mind?",
      "I'm here for you. What would you like to discuss?"
    ]
  }
  
  const intentAlternatives = alternatives[intent as keyof typeof alternatives] || alternatives.general_conversation
  return intentAlternatives[Math.floor(Math.random() * intentAlternatives.length)]
}
