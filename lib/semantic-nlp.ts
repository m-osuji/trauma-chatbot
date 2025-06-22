export interface SemanticMatch {
  intent: string
  confidence: number
  extractedData: Record<string, any>
}

export class SemanticNLP {
  private static instance: SemanticNLP
  private tfidf: Map<string, number> = new Map()
  private intentTemplates: Map<string, string[]> = new Map()
  
  // Pre-defined intent templates
  private templates = {
    provide_name: [
      "my name is",
      "i'm called",
      "call me",
      "i am",
      "hi i'm",
      "hello i'm",
      "this is",
      "name is"
    ],
    provide_age: [
      "i'm years old",
      "i am years old", 
      "my age is",
      "years old",
      "i'm and years old",
      "age is",
      "turning years"
    ],
    provide_timing: [
      "yesterday",
      "today",
      "last week",
      "this morning",
      "when it happened",
      "the incident occurred",
      "it happened",
      "occurred",
      "took place"
    ],
    provide_location: [
      "it happened in",
      "i was in",
      "the location was",
      "at the",
      "in the",
      "near the",
      "location is",
      "place was",
      "area was"
    ],
    incident_narrative: [
      "he called me",
      "she said",
      "they threatened",
      "someone approached",
      "a person came up",
      "he touched me",
      "she grabbed me",
      "he pushed me",
      "she pulled me",
      "he threatened",
      "she threatened",
      "they said",
      "he shouted",
      "she yelled",
      "he hit me",
      "she hit me",
      "he punched me",
      "she punched me",
      "he slapped me",
      "she slapped me",
      "he kicked me",
      "she kicked me",
      "he came up to me",
      "she came up to me"
    ],
    vulnerability_context: [
      "i was alone",
      "by myself",
      "in a wheelchair",
      "i have a disability",
      "i'm young",
      "i'm a minor",
      "i'm disabled",
      "i have mobility issues",
      "i'm vulnerable",
      "i'm helpless",
      "i'm powerless"
    ],
    provide_contact: [
      "my email is",
      "my phone number is",
      "my contact number is",
      "you can reach me at",
      "my email address is",
      "my phone is"
    ],
    provide_evidence: [
      "i have photos",
      "i took a video",
      "i have evidence",
      "i have pictures",
      "i recorded it",
      "i have footage",
      "there's cctv",
      "security cameras",
      "surveillance footage"
    ],
    provide_witnesses: [
      "someone else saw",
      "there were witnesses",
      "other people saw",
      "witnesses saw",
      "people saw what happened",
      "others witnessed"
    ],
    provide_suspect: [
      "i know who did it",
      "i can describe them",
      "i don't know who it was",
      "his name is",
      "her name is",
      "he's about",
      "she's about",
      "he was driving",
      "she was driving",
      "the car registration"
    ],
    provide_public_transport: [
      "i was on the bus",
      "i was on the train",
      "i was on public transport",
      "i used my oyster card",
      "i used my contactless card",
      "i was on the tube",
      "i was on the tram"
    ]
  }

  static getInstance(): SemanticNLP {
    if (!SemanticNLP.instance) {
      SemanticNLP.instance = new SemanticNLP()
      SemanticNLP.instance.initialize()
    }
    return SemanticNLP.instance
  }

  private initialize() {
    // Initialize templates
    for (const [intent, phrases] of Object.entries(this.templates)) {
      this.intentTemplates.set(intent, phrases)
    }
    
    // Build TF-IDF vocabulary from all templates
    this.buildVocabulary()
  }

  private buildVocabulary() {
    const allWords = new Set<string>()
    const wordCounts = new Map<string, number>()
    
    // Collect all words from all templates
    for (const phrases of this.intentTemplates.values()) {
      for (const phrase of phrases) {
        const words = this.tokenize(phrase)
        words.forEach(word => {
          allWords.add(word)
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        })
      }
    }
    
    // Calculate TF-IDF weights
    const totalDocuments = Array.from(this.intentTemplates.values()).flat().length
    for (const word of allWords) {
      const documentFrequency = wordCounts.get(word) || 0
      const idf = Math.log(totalDocuments / documentFrequency)
      this.tfidf.set(word, idf)
    }
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
  }

  async classifyIntent(text: string): Promise<SemanticMatch> {
    const userTokens = this.tokenize(text.toLowerCase())
    let bestMatch: SemanticMatch = {
      intent: 'general_conversation',
      confidence: 0,
      extractedData: {}
    }

    // Compare with all intent templates
    for (const [intent, phrases] of this.intentTemplates.entries()) {
      for (const phrase of phrases) {
        const templateTokens = this.tokenize(phrase)
        const similarity = this.calculateSimilarity(userTokens, templateTokens)
        
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            intent,
            confidence: similarity,
            extractedData: this.extractDataFromIntent(intent, text)
          }
        }
      }
    }

    // Only return high-confidence matches
    if (bestMatch.confidence > 0.6) {
      return bestMatch
    }

    return {
      intent: 'general_conversation',
      confidence: 0.5,
      extractedData: {}
    }
  }

  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0
    
    // Create TF-IDF vectors
    const vector1 = this.createTFIDFVector(tokens1)
    const vector2 = this.createTFIDFVector(tokens2)
    
    // Calculate cosine similarity
    return this.cosineSimilarity(vector1, vector2)
  }

  private createTFIDFVector(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>()
    const wordFreq = new Map<string, number>()
    
    // Count word frequencies
    tokens.forEach(token => {
      wordFreq.set(token, (wordFreq.get(token) || 0) + 1)
    })
    
    // Calculate TF-IDF
    tokens.forEach(token => {
      const tf = wordFreq.get(token) || 0
      const idf = this.tfidf.get(token) || 0
      vector.set(token, tf * idf)
    })
    
    return vector
  }

  private cosineSimilarity(vector1: Map<string, number>, vector2: Map<string, number>): number {
    const allWords = new Set([...vector1.keys(), ...vector2.keys()])
    
    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0
    
    for (const word of allWords) {
      const val1 = vector1.get(word) || 0
      const val2 = vector2.get(word) || 0
      
      dotProduct += val1 * val2
      magnitude1 += val1 * val1
      magnitude2 += val2 * val2
    }
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0
    
    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
  }

  private extractDataFromIntent(intent: string, text: string): Record<string, any> {
    const extracted: Record<string, any> = {}
    
    switch (intent) {
      case 'provide_name':
        const namePatterns = [
          /my name is ([^.!?]+)/i,
          /i'm called ([^.!?]+)/i,
          /call me ([^.!?]+)/i,
          /i am ([^.!?]+)/i,
          /hi i'm ([^.!?]+)/i,
          /hello i'm ([^.!?]+)/i,
          /this is ([^.!?]+)/i,
          /name is ([^.!?]+)/i
        ]
        
        for (const pattern of namePatterns) {
          const match = text.match(pattern)
          if (match) {
            const fullName = match[1].trim()
            const nameParts = fullName.split(' ')
            extracted.first_name = nameParts[0] || ''
            extracted.surname = nameParts.slice(1).join(' ') || ''
            break
          }
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
        const timingData = this.parseRelativeTime(text)
        Object.assign(extracted, timingData)
        break
        
      case 'provide_location':
        const locationPatterns = [
          /it happened in ([^.!?]+)/i,
          /i was in ([^.!?]+)/i,
          /the location was ([^.!?]+)/i,
          /at the ([^.!?]+)/i,
          /in the ([^.!?]+)/i,
          /near the ([^.!?]+)/i,
          /location is ([^.!?]+)/i,
          /place was ([^.!?]+)/i,
          /area was ([^.!?]+)/i
        ]
        
        for (const pattern of locationPatterns) {
          const match = text.match(pattern)
          if (match) {
            extracted.town_city = match[1].trim()
            break
          }
        }
        break
        
      case 'incident_narrative':
        extracted.incident_narrative = 'Incident details provided'
        break
        
      case 'vulnerability_context':
        if (text.match(/wheelchair|disability|mobility issues/i)) {
          extracted.disability = 'Yes'
        }
        if (text.match(/alone|by myself|on my own/i)) {
          extracted.vulnerability_context = 'alone'
        }
        break
        
      case 'provide_contact':
        const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
        if (emailMatch) {
          extracted.email = emailMatch[0]
        }
        
        const phoneMatch = text.match(/(\+?[\d\s\-\(\)]{10,})/)
        if (phoneMatch) {
          extracted.phone_number = phoneMatch[1].replace(/\s+/g, '')
        }
        break
        
      case 'provide_evidence':
        if (text.match(/photos|pictures|video|footage|recorded/i)) {
          extracted.have_personal_media = 'Yes'
        }
        if (text.match(/cctv|security cameras|surveillance/i)) {
          extracted.third_party_video = 'Yes'
        }
        break
        
      case 'provide_witnesses':
        if (text.match(/witnesses|someone else saw|other people saw/i)) {
          extracted.has_witnesses = 'Yes'
        }
        break
        
      case 'provide_suspect':
        if (text.match(/i know who did it/i)) {
          extracted.suspect_known = 'known'
        } else if (text.match(/i can describe them/i)) {
          extracted.suspect_known = 'describe'
        } else if (text.match(/i don't know who it was/i)) {
          extracted.suspect_known = 'unknown'
        }
        
        const suspectNameMatch = text.match(/(?:his|her) name is ([^.!?]+)/i)
        if (suspectNameMatch) {
          extracted.sus_first_name = suspectNameMatch[1].trim()
        }
        
        const suspectAgeMatch = text.match(/(?:he's|she's) about (\d+)/i)
        if (suspectAgeMatch) {
          extracted.sus_approx_age = suspectAgeMatch[1]
        }
        
        if (text.match(/driving|car|vehicle/i)) {
          extracted.sus_in_vehicle = 'Yes'
        }
        
        const regMatch = text.match(/registration (?:was|is) ([A-Z0-9]+)/i)
        if (regMatch) {
          extracted.sus_vehicle_reg = regMatch[1]
        }
        break
        
      case 'provide_public_transport':
        if (text.match(/bus|train|tube|tram|public transport/i)) {
          extracted.public_transport = 'Yes'
        }
        if (text.match(/oyster card|contactless card/i)) {
          extracted.transport_card_details = text
        }
        break
    }
    
    return extracted
  }

  private parseRelativeTime(text: string): Record<string, any> {
    const now = new Date()
    const lowerText = text.toLowerCase()
    let targetDate = new Date(now)
    
    if (lowerText.includes('yesterday')) {
      targetDate.setDate(now.getDate() - 1)
    } else if (lowerText.includes('day before yesterday')) {
      targetDate.setDate(now.getDate() - 2)
    } else if (lowerText.includes('last night')) {
      targetDate.setDate(now.getDate() - 1)
      targetDate.setHours(20, 0, 0, 0)
    } else if (lowerText.includes('this morning')) {
      targetDate.setHours(9, 0, 0, 0)
    } else if (lowerText.includes('this afternoon')) {
      targetDate.setHours(14, 0, 0, 0)
    } else if (lowerText.includes('this evening')) {
      targetDate.setHours(18, 0, 0, 0)
    } else if (lowerText.includes('last week')) {
      targetDate.setDate(now.getDate() - 7)
    } else if (lowerText.includes('two weeks ago')) {
      targetDate.setDate(now.getDate() - 14)
    } else if (lowerText.includes('last month')) {
      targetDate.setMonth(now.getMonth() - 1)
    } else if (lowerText.includes('few days ago')) {
      targetDate.setDate(now.getDate() - 3)
    } else if (lowerText.includes('couple of days ago')) {
      targetDate.setDate(now.getDate() - 2)
    }
    
    return {
      start_day: targetDate.getDate().toString(),
      start_month: (targetDate.getMonth() + 1).toString(),
      start_year: targetDate.getFullYear().toString()
    }
  }
} 