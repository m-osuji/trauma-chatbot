import { pipeline, AutoTokenizer, AutoModel } from '@xenova/transformers'

export interface SemanticMatch {
  intent: string
  confidence: number
  extractedData: Record<string, any>
}

export class LocalNLPEngine {
  private static instance: LocalNLPEngine
  private tokenizer: any
  private model: any
  private embeddings: Map<string, number[]> = new Map()
  
  // Pre-defined intent templates with semantic embeddings
  private intentTemplates = {
    provide_name: [
      "my name is",
      "i'm called",
      "call me",
      "i am",
      "hi i'm",
      "hello i'm"
    ],
    provide_age: [
      "i'm years old",
      "i am years old", 
      "my age is",
      "years old",
      "i'm and years old"
    ],
    provide_timing: [
      "yesterday",
      "today",
      "last week",
      "this morning",
      "when it happened",
      "the incident occurred"
    ],
    provide_location: [
      "it happened in",
      "i was in",
      "the location was",
      "at the",
      "in the",
      "near the"
    ],
    incident_narrative: [
      "he called me",
      "she said",
      "they threatened",
      "someone approached",
      "a person came up",
      "he touched me",
      "she grabbed me"
    ],
    vulnerability_context: [
      "i was alone",
      "by myself",
      "in a wheelchair",
      "i have a disability",
      "i'm young",
      "i'm a minor"
    ]
  }

  static async getInstance(): Promise<LocalNLPEngine> {
    if (!LocalNLPEngine.instance) {
      LocalNLPEngine.instance = new LocalNLPEngine()
      await LocalNLPEngine.instance.initialize()
    }
    return LocalNLPEngine.instance
  }

  private async initialize() {
    try {
      // Use a lightweight model that runs entirely locally
      this.tokenizer = await AutoTokenizer.from_pretrained('Xenova/all-MiniLM-L6-v2')
      this.model = await AutoModel.from_pretrained('Xenova/all-MiniLM-L6-v2')
      
      // Pre-compute embeddings for all intent templates
      await this.precomputeEmbeddings()
      
      console.log('✅ Local NLP Engine initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Local NLP Engine:', error)
      // Fallback to pattern matching
      this.useFallbackMode = true
    }
  }

  private async precomputeEmbeddings() {
    for (const [intent, templates] of Object.entries(this.intentTemplates)) {
      for (const template of templates) {
        const embedding = await this.getEmbedding(template)
        this.embeddings.set(`${intent}:${template}`, embedding)
      }
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const inputs = await this.tokenizer(text)
      const outputs = await this.model(inputs)
      return Array.from(outputs.last_hidden_state.data)
    } catch (error) {
      console.warn('Embedding generation failed, using fallback:', error)
      return []
    }
  }

  private useFallbackMode = false

  async classifyIntent(text: string): Promise<SemanticMatch> {
    if (this.useFallbackMode) {
      return this.fallbackClassification(text)
    }

    try {
      const userEmbedding = await this.getEmbedding(text.toLowerCase())
      let bestMatch: SemanticMatch = {
        intent: 'general_conversation',
        confidence: 0,
        extractedData: {}
      }

      // Compare with all intent templates
      for (const [key, embedding] of this.embeddings.entries()) {
        const [intent] = key.split(':')
        const similarity = this.cosineSimilarity(userEmbedding, embedding)
        
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            intent,
            confidence: similarity,
            extractedData: this.extractDataFromIntent(intent, text)
          }
        }
      }

      // Only return high-confidence matches
      if (bestMatch.confidence > 0.7) {
        return bestMatch
      }

      return {
        intent: 'general_conversation',
        confidence: 0.5,
        extractedData: {}
      }

    } catch (error) {
      console.warn('Semantic classification failed, using fallback:', error)
      return this.fallbackClassification(text)
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length === 0 || vec2.length === 0) return 0
    
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0))
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0))
    
    return dotProduct / (magnitude1 * magnitude2)
  }

  private extractDataFromIntent(intent: string, text: string): Record<string, any> {
    const extracted: Record<string, any> = {}
    
    switch (intent) {
      case 'provide_name':
        const nameMatch = text.match(/(?:my name is|i'm called|call me|i am|hi i'm|hello i'm)\s+([^.!?]+)/i)
        if (nameMatch) {
          const fullName = nameMatch[1].trim()
          const nameParts = fullName.split(' ')
          extracted.first_name = nameParts[0] || ''
          extracted.surname = nameParts.slice(1).join(' ') || ''
        }
        break
        
      case 'provide_age':
        const ageMatch = text.match(/(\d+)/)
        if (ageMatch) {
          const age = parseInt(ageMatch[1])
          if (age >= 1 && age <= 120) {
            extracted.age = ageMatch[1]
          }
        }
        break
        
      case 'provide_timing':
        // Use existing relative time parsing
        const timingData = this.parseRelativeTime(text)
        Object.assign(extracted, timingData)
        break
        
      case 'provide_location':
        const locationMatch = text.match(/(?:it happened in|i was in|the location was|at the|in the|near the)\s+([^.!?]+)/i)
        if (locationMatch) {
          extracted.town_city = locationMatch[1].trim()
        }
        break
        
      case 'incident_narrative':
        extracted.incident_narrative = 'Incident details provided'
        break
        
      case 'vulnerability_context':
        if (text.match(/wheelchair|disability/i)) {
          extracted.disability = 'Yes'
        }
        if (text.match(/alone|by myself/i)) {
          extracted.vulnerability_context = 'alone'
        }
        break
    }
    
    return extracted
  }

  private parseRelativeTime(text: string): Record<string, any> {
    // Reuse existing relative time parsing logic
    const now = new Date()
    const lowerText = text.toLowerCase()
    let targetDate = new Date(now)
    
    if (lowerText.includes('yesterday')) {
      targetDate.setDate(now.getDate() - 1)
    } else if (lowerText.includes('last week')) {
      targetDate.setDate(now.getDate() - 7)
    } else if (lowerText.includes('this morning')) {
      targetDate.setHours(9, 0, 0, 0)
    }
    
    return {
      start_day: targetDate.getDate().toString(),
      start_month: (targetDate.getMonth() + 1).toString(),
      start_year: targetDate.getFullYear().toString()
    }
  }

  private fallbackClassification(text: string): SemanticMatch {
    // Fallback to pattern matching when embeddings fail
    const lowerText = text.toLowerCase()
    
    if (lowerText.match(/my name is|i'm called|call me/i)) {
      return {
        intent: 'provide_name',
        confidence: 0.8,
        extractedData: this.extractDataFromIntent('provide_name', text)
      }
    }
    
    if (lowerText.match(/\d+/) && lowerText.match(/years? old|age/i)) {
      return {
        intent: 'provide_age',
        confidence: 0.8,
        extractedData: this.extractDataFromIntent('provide_age', text)
      }
    }
    
    if (lowerText.match(/yesterday|today|last week|this morning/i)) {
      return {
        intent: 'provide_timing',
        confidence: 0.8,
        extractedData: this.extractDataFromIntent('provide_timing', text)
      }
    }
    
    return {
      intent: 'general_conversation',
      confidence: 0.5,
      extractedData: {}
    }
  }
} 