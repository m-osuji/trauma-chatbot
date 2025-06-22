import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsService, defaultElevenLabsConfig } from '@/lib/elevenlabs'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    
    if (!text) {
      return new Response('Text is required', { status: 400 })
    }

    // Initialize ElevenLabs service
    const elevenLabs = ElevenLabsService.getInstance(defaultElevenLabsConfig)
    
    // Convert text to speech
    const audioBuffer = await elevenLabs.textToSpeech(text)
    
    // Return audio as MP3
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('TTS API error:', error)
    return new Response('TTS service error', { status: 500 })
  }
} 