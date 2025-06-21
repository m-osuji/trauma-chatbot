import { NextRequest, NextResponse } from 'next/server'
import { SecureNLPPipeline } from '@/lib/secure-nlp'

export const maxDuration = 30

// SECURITY NOTICE: This system prioritizes user privacy and anonymity
// - All processing happens locally using lightweight NLP
// - No data is sent to external services
// - No LLM integration to prevent data exposure
// - All trauma-sensitive content stays within the user's device

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
    
    // Log confidence for debugging but never expose user data
    console.log(`Processing confidence: ${processed.confidence.toFixed(2)}`)
    
    // Return the secure NLP response
    return new Response(
      processed.response,
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
