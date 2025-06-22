import { pipeline, AutoTokenizer, AutoModel } from '@xenova/transformers'

export interface SemanticMatch {
  intent: string
  confidence: number
  extractedData: Record<string, any>
  context: ConversationContext
}

export interface ConversationContext {
  previousIntents: string[]
  extractedFields: Set<string>
  conversationStage: string
  traumaIndicators: string[]
  userSentiment: number
}

export class EnhancedNLPEngine {
  private static instance: EnhancedNLPEngine
  private tokenizer: any
  private model: any
  private embeddings: Map<string, number[]> = new Map()
  private conversationMemory: Map<string, any> = new Map()
  
  // Extensive intent templates with real-world variations
  private intentTemplates = {
    provide_name: [
      "my name is", "i'm called", "call me", "i am", "hi i'm", "hello i'm",
      "this is", "name is", "you can call me", "i go by", "people call me",
      "my first name is", "my name's", "i'm", "this is", "introducing myself as"
    ],
    provide_age: [
      "i'm years old", "i am years old", "my age is", "years old", "i'm and years old",
      "age is", "turning years", "i'm a year old", "my age", "i'm years",
      "i'm in my", "i'm a teenager", "i'm a minor", "i'm under", "i'm over"
    ],
    provide_timing: [
      "yesterday", "today", "last week", "this morning", "when it happened",
      "the incident occurred", "it happened", "occurred", "took place",
      "last night", "this afternoon", "this evening", "tonight", "few days ago",
      "couple of days ago", "last month", "two weeks ago", "hour ago", "minutes ago",
      "recently", "the other day", "earlier today", "earlier this week"
    ],
    provide_location: [
      "it happened in", "i was in", "the location was", "at the", "in the", "near the",
      "location is", "place was", "area was", "it occurred at", "i was at",
      "the incident was at", "this took place in", "i was walking in", "i was in the",
      "near", "around", "close to", "by the", "outside", "inside", "at", "in"
    ],
    incident_narrative: [
      "he called me", "she said", "they threatened", "someone approached", "a person came up",
      "he touched me", "she grabbed me", "he pushed me", "she pulled me", "he threatened",
      "she threatened", "they said", "he shouted", "she yelled", "he hit me", "she hit me",
      "he punched me", "she punched me", "he slapped me", "she slapped me", "he kicked me",
      "she kicked me", "he came up to me", "she came up to me", "he grabbed", "she grabbed",
      "he touched", "she touched", "he pushed", "she pushed", "he pulled", "she pulled",
      "he hit", "she hit", "he punched", "she punched", "he slapped", "she slapped",
      "he kicked", "she kicked", "he threatened", "she threatened", "he said", "she said",
      "he shouted", "she shouted", "he yelled", "she yelled", "he came up", "she came up",
      "someone touched me", "someone grabbed me", "someone pushed me", "someone pulled me",
      "someone hit me", "someone punched me", "someone slapped me", "someone kicked me",
      "someone threatened me", "someone said", "someone shouted", "someone yelled",
      "a man touched me", "a woman touched me", "a man grabbed me", "a woman grabbed me",
      "a man pushed me", "a woman pushed me", "a man pulled me", "a woman pulled me",
      "a man hit me", "a woman hit me", "a man punched me", "a woman punched me",
      "a man slapped me", "a woman slapped me", "a man kicked me", "a woman kicked me",
      "a man threatened me", "a woman threatened me", "a man said", "a woman said",
      "a man shouted", "a woman shouted", "a man yelled", "a woman yelled",
      "a man came up", "a woman came up", "a man approached", "a woman approached"
    ],
    vulnerability_context: [
      "i was alone", "by myself", "in a wheelchair", "i have a disability", "i'm young",
      "i'm a minor", "i'm disabled", "i have mobility issues", "i'm vulnerable",
      "i'm helpless", "i'm powerless", "i couldn't move", "i couldn't fight back",
      "i was trapped", "i couldn't leave", "i was stuck", "i was helpless",
      "i was powerless", "i couldn't do anything", "i couldn't stop it",
      "i was scared", "i was terrified", "i was frightened", "i was panicked",
      "i was anxious", "i was worried", "i was nervous", "i was shocked",
      "i was traumatized", "i was upset", "i was angry", "i was sad",
      "i was depressed", "i was crying", "i was in tears", "i was emotional",
      "i was distressed", "i was overwhelmed", "i was confused", "i was disoriented"
    ],
    provide_contact: [
      "my email is", "my phone number is", "my contact number is", "you can reach me at",
      "my email address is", "my phone is", "my number is", "my contact is",
      "you can contact me at", "my email", "my phone", "my number", "my contact",
      "email me at", "call me at", "text me at", "reach me at", "contact me at"
    ],
    provide_evidence: [
      "i have photos", "i took a video", "i have evidence", "i have pictures",
      "i recorded it", "i have footage", "there's cctv", "security cameras",
      "surveillance footage", "i have proof", "i have documentation",
      "i took pictures", "i have recordings", "i have videos", "i have images",
      "there are cameras", "there's video", "there's footage", "there's evidence"
    ],
    provide_witnesses: [
      "someone else saw", "there were witnesses", "other people saw", "witnesses saw",
      "people saw what happened", "others witnessed", "someone witnessed",
      "people saw", "others saw", "witnesses were there", "people were there",
      "others were there", "someone was there", "people saw it", "others saw it"
    ],
    provide_suspect: [
      "i know who did it", "i can describe them", "i don't know who it was",
      "his name is", "her name is", "he's about", "she's about", "he was driving",
      "she was driving", "the car registration", "i can identify them",
      "i recognize them", "i've seen them before", "i know them", "i don't know them",
      "they were a stranger", "i can describe the person", "i can give a description",
      "i remember what they looked like", "i can tell you what they looked like"
    ],
    provide_public_transport: [
      "i was on the bus", "i was on the train", "i was on public transport",
      "i used my oyster card", "i used my contactless card", "i was on the tube",
      "i was on the tram", "i was on the subway", "i was on the metro",
      "i was traveling by bus", "i was traveling by train", "i was traveling by tube",
      "i was traveling by tram", "i was traveling by subway", "i was traveling by metro"
    ],
    trauma_indicators: [
      "i was trapped", "i couldn't leave", "i was stuck", "i was helpless",
      "i was powerless", "i couldn't move", "i couldn't fight back",
      "i couldn't do anything", "i couldn't stop it", "i was scared",
      "i was terrified", "i was frightened", "i was panicked", "i was anxious",
      "i was worried", "i was nervous", "i was shocked", "i was traumatized",
      "i was upset", "i was angry", "i was sad", "i was depressed",
      "i was crying", "i was in tears", "i was emotional", "i was distressed",
      "i was overwhelmed", "i was confused", "i was disoriented", "i was numb",
      "i was frozen", "i couldn't speak", "i couldn't breathe", "i was shaking",
      "i was trembling", "i was sweating", "i was cold", "i was hot",
      "i was dizzy", "i was lightheaded", "i was nauseous", "i was sick"
    ]
  }

  static async getInstance(): Promise<EnhancedNLPEngine> {
    if (!EnhancedNLPEngine.instance) {
      EnhancedNLPEngine.instance = new EnhancedNLPEngine()
      await EnhancedNLPEngine.instance.initialize()
    }
    return EnhancedNLPEngine.instance
  }

  private async initialize() {
    try {
      // Use a more robust model for better embeddings
      this.tokenizer = await AutoTokenizer.from_pretrained('Xenova/all-MiniLM-L6-v2')
      this.model = await AutoModel.from_pretrained('Xenova/all-MiniLM-L6-v2')
      
      // Pre-compute embeddings for all intent templates
      await this.precomputeEmbeddings()
      
      console.log('✅ Enhanced NLP Engine initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced NLP Engine:', error)
      throw error
    }
  }

  private async precomputeEmbeddings() {
    console.log('🔄 Pre-computing embeddings for intent templates...')
    for (const [intent, templates] of Object.entries(this.intentTemplates)) {
      for (const template of templates) {
        const embedding = await this.getEmbedding(template)
        this.embeddings.set(`${intent}:${template}`, embedding)
      }
    }
    console.log(`✅ Pre-computed ${this.embeddings.size} embeddings`)
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const inputs = await this.tokenizer(text)
      const outputs = await this.model(inputs)
      return Array.from(outputs.last_hidden_state.data)
    } catch (error) {
      console.warn('Embedding generation failed:', error)
      return []
    }
  }

  async classifyIntent(text: string, sessionId: string): Promise<SemanticMatch> {
    try {
      const userEmbedding = await this.getEmbedding(text.toLowerCase())
      let bestMatch: SemanticMatch = {
        intent: 'general_conversation',
        confidence: 0,
        extractedData: {},
        context: this.getConversationContext(sessionId)
      }

      // Compare with all intent templates
      for (const [key, embedding] of this.embeddings.entries()) {
        const [intent] = key.split(':')
        const similarity = this.cosineSimilarity(userEmbedding, embedding)
        
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            intent,
            confidence: similarity,
            extractedData: this.extractDataFromIntent(intent, text),
            context: this.getConversationContext(sessionId)
          }
        }
      }

      // Higher confidence threshold for critical applications
      if (bestMatch.confidence > 0.8) {
        this.updateConversationContext(sessionId, bestMatch)
        return bestMatch
      }

      // If no high-confidence match, try context-aware classification
      const contextMatch = this.classifyWithContext(text, sessionId)
      if (contextMatch.confidence > 0.6) {
        this.updateConversationContext(sessionId, contextMatch)
        return contextMatch
      }

      return {
        intent: 'general_conversation',
        confidence: 0.5,
        extractedData: {},
        context: this.getConversationContext(sessionId)
      }

    } catch (error) {
      console.warn('Semantic classification failed:', error)
      return this.fallbackClassification(text, sessionId)
    }
  }

  private classifyWithContext(text: string, sessionId: string): SemanticMatch {
    const context = this.getConversationContext(sessionId)
    const lowerText = text.toLowerCase()
    
    // Use conversation context to improve classification
    if (context.previousIntents.includes('provide_name') && !context.extractedFields.has('age')) {
      if (lowerText.match(/\d+/) && (lowerText.includes('old') || lowerText.includes('age'))) {
        return {
          intent: 'provide_age',
          confidence: 0.75,
          extractedData: this.extractDataFromIntent('provide_age', text),
          context
        }
      }
    }
    
    if (context.previousIntents.includes('provide_age') && !context.extractedFields.has('timing')) {
      if (lowerText.match(/yesterday|today|last|ago|when|time|date|morning|afternoon|evening|night/)) {
        return {
          intent: 'provide_timing',
          confidence: 0.75,
          extractedData: this.extractDataFromIntent('provide_timing', text),
          context
        }
      }
    }
    
    return {
      intent: 'general_conversation',
      confidence: 0.5,
      extractedData: {},
      context
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
        const namePatterns = [
          /my name is ([^.!?]+)/i,
          /i'm called ([^.!?]+)/i,
          /call me ([^.!?]+)/i,
          /i am ([^.!?]+)/i,
          /hi i'm ([^.!?]+)/i,
          /hello i'm ([^.!?]+)/i,
          /this is ([^.!?]+)/i,
          /name is ([^.!?]+)/i,
          /you can call me ([^.!?]+)/i,
          /i go by ([^.!?]+)/i,
          /people call me ([^.!?]+)/i,
          /my first name is ([^.!?]+)/i,
          /my name's ([^.!?]+)/i,
          /i'm ([^.!?]+)/i,
          /this is ([^.!?]+)/i,
          /introducing myself as ([^.!?]+)/i
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
        const agePatterns = [
          /(\d+)\s*years?\s*old/i,
          /i'm\s*(\d+)/i,
          /i am\s*(\d+)/i,
          /my age is\s*(\d+)/i,
          /age is\s*(\d+)/i,
          /turning\s*(\d+)/i,
          /i'm a\s*(\d+)\s*year old/i,
          /my age\s*(\d+)/i,
          /i'm\s*(\d+)\s*years/i,
          /i'm in my\s*(\d+)/i,
          /i'm a teenager/i,
          /i'm a minor/i,
          /i'm under\s*(\d+)/i,
          /i'm over\s*(\d+)/i
        ]
        
        for (const pattern of agePatterns) {
          const match = text.match(pattern)
          if (match) {
            if (pattern.source.includes('teenager')) {
              extracted.age = '15'
            } else if (pattern.source.includes('minor')) {
              extracted.age = '17'
            } else {
              const age = parseInt(match[1])
              if (age >= 1 && age <= 120) {
                extracted.age = age.toString()
              }
            }
            break
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
          /area was ([^.!?]+)/i,
          /it occurred at ([^.!?]+)/i,
          /i was at ([^.!?]+)/i,
          /the incident was at ([^.!?]+)/i,
          /this took place in ([^.!?]+)/i,
          /i was walking in ([^.!?]+)/i,
          /i was in the ([^.!?]+)/i,
          /near ([^.!?]+)/i,
          /around ([^.!?]+)/i,
          /close to ([^.!?]+)/i,
          /by the ([^.!?]+)/i,
          /outside ([^.!?]+)/i,
          /inside ([^.!?]+)/i,
          /at ([^.!?]+)/i,
          /in ([^.!?]+)/i
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
        // Extract more detailed incident information
        if (text.match(/touched|grabbed|pushed|pulled|hit|punched|slapped|kicked/i)) {
          extracted.incident_narrative = 'Physical contact occurred'
        } else if (text.match(/threatened|said they would|said he would|said she would/i)) {
          extracted.incident_narrative = 'Threats were made'
        } else if (text.match(/called me|said|told me|shouted|yelled/i)) {
          extracted.incident_narrative = 'Verbal interaction occurred'
        } else {
          extracted.incident_narrative = 'Incident details provided'
        }
        break
        
      case 'vulnerability_context':
        if (text.match(/wheelchair|disability|mobility issues/i)) {
          extracted.disability = 'Yes'
        }
        if (text.match(/alone|by myself|on my own/i)) {
          extracted.vulnerability_context = 'alone'
        }
        if (text.match(/young|minor|teenager/i)) {
          extracted.age_group = 'young'
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
        
      case 'trauma_indicators':
        // Extract trauma indicators for better support
        if (text.match(/trapped|couldn't leave|stuck|helpless|powerless/i)) {
          extracted.trauma_type = 'entrapment'
        }
        if (text.match(/scared|terrified|frightened|panicked|anxious/i)) {
          extracted.trauma_type = 'fear'
        }
        if (text.match(/shocked|traumatized|upset|angry|sad/i)) {
          extracted.trauma_type = 'emotional_distress'
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
    } else if (lowerText.includes('hour ago')) {
      targetDate.setHours(now.getHours() - 1)
    } else if (lowerText.includes('hours ago')) {
      const hoursMatch = lowerText.match(/(\d+)\s*hours?\s*ago/)
      if (hoursMatch) {
        targetDate.setHours(now.getHours() - parseInt(hoursMatch[1]))
      }
    } else if (lowerText.includes('minutes ago')) {
      const minutesMatch = lowerText.match(/(\d+)\s*minutes?\s*ago/)
      if (minutesMatch) {
        targetDate.setMinutes(now.getMinutes() - parseInt(minutesMatch[1]))
      }
    } else if (lowerText.includes('today')) {
      // Keep current date
    } else if (lowerText.includes('tonight')) {
      targetDate.setHours(20, 0, 0, 0)
    }
    
    return {
      start_day: targetDate.getDate().toString(),
      start_month: (targetDate.getMonth() + 1).toString(),
      start_year: targetDate.getFullYear().toString()
    }
  }

  private getConversationContext(sessionId: string): ConversationContext {
    const context = this.conversationMemory.get(sessionId) || {
      previousIntents: [],
      extractedFields: new Set<string>(),
      conversationStage: 'introduction',
      traumaIndicators: [],
      userSentiment: 0
    }
    return context
  }

  private updateConversationContext(sessionId: string, match: SemanticMatch) {
    const context = this.getConversationContext(sessionId)
    context.previousIntents.push(match.intent)
    if (context.previousIntents.length > 10) {
      context.previousIntents.shift()
    }
    
    // Update extracted fields
    Object.keys(match.extractedData).forEach(field => {
      context.extractedFields.add(field)
    })
    
    this.conversationMemory.set(sessionId, context)
  }

  private fallbackClassification(text: string, sessionId: string): SemanticMatch {
    const context = this.getConversationContext(sessionId)
    const lowerText = text.toLowerCase()
    
    if (lowerText.match(/my name is|i'm called|call me/i)) {
      return {
        intent: 'provide_name',
        confidence: 0.8,
        extractedData: this.extractDataFromIntent('provide_name', text),
        context
      }
    }
    
    if (lowerText.match(/\d+/) && lowerText.match(/years? old|age/i)) {
      return {
        intent: 'provide_age',
        confidence: 0.8,
        extractedData: this.extractDataFromIntent('provide_age', text),
        context
      }
    }
    
    if (lowerText.match(/yesterday|today|last week|this morning/i)) {
      return {
        intent: 'provide_timing',
        confidence: 0.8,
        extractedData: this.extractDataFromIntent('provide_timing', text),
        context
      }
    }
    
    return {
      intent: 'general_conversation',
      confidence: 0.5,
      extractedData: {},
      context
    }
  }

  // Clear conversation memory for a session
  clearSession(sessionId: string): void {
    this.conversationMemory.delete(sessionId)
  }
} 