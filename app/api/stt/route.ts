import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsService, defaultElevenLabsConfig } from '@/lib/elevenlabs'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return new Response('Audio file is required', { status: 400 })
    }

    // Initialize ElevenLabs service
    const elevenLabs = ElevenLabsService.getInstance(defaultElevenLabsConfig)
    
    // Convert speech to text
    const text = await elevenLabs.speechToText(audioFile)
    
    // Return transcribed text
    return new Response(JSON.stringify({ text }), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('STT API error:', error)
    return new Response('STT service error', { status: 500 })
  }
} 