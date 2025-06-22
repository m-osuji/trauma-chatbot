// ElevenLabs integration for TTS and STT
export interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  modelId: string
}

export class ElevenLabsService {
  private config: ElevenLabsConfig
  private static instance: ElevenLabsService

  private constructor(config: ElevenLabsConfig) {
    this.config = config
  }

  static getInstance(config?: ElevenLabsConfig): ElevenLabsService {
    if (!ElevenLabsService.instance && config) {
      ElevenLabsService.instance = new ElevenLabsService(config)
    }
    return ElevenLabsService.instance
  }

  // Text-to-Speech
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: this.config.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.status}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error('ElevenLabs TTS error:', error)
      throw error
    }
  }

  // Speech-to-Text (using ElevenLabs STT)
  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('model_id', 'eleven_multilingual_v2')

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs STT error: ${response.status}`)
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('ElevenLabs STT error:', error)
      throw error
    }
  }

  // Get available voices
  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.config.apiKey,
        }
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs voices error: ${response.status}`)
      }

      const result = await response.json()
      return result.voices || []
    } catch (error) {
      console.error('ElevenLabs voices error:', error)
      return []
    }
  }

  // Get available models
  async getModels(): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/models', {
        headers: {
          'xi-api-key': this.config.apiKey,
        }
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs models error: ${response.status}`)
      }

      const result = await response.json()
      return result.models || []
    } catch (error) {
      console.error('ElevenLabs models error:', error)
      return []
    }
  }
}

// Default configuration (should be set via environment variables)
export const defaultElevenLabsConfig: ElevenLabsConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Rachel voice
  modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1'
} 