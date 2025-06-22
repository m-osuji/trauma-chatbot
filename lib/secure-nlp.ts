import { ConversationStateManager } from './conversation-state'
import { SemanticNLP } from './semantic-nlp'

export interface ProcessedInput {
  sentiment: number // -1 to 1
  intent: string
  extractedData: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high'
  response: string
  indicators: TraumaIndicators
  confidence: number // 0 to 1 - how confident we are in our processing
  responseId: string // Unique identifier to prevent repetition
  nextQuestion: string // What question to ask next
  progress: ConversationProgress // Track what's been answered
}

interface TraumaIndicators {
  hasIncident: boolean
  hasThreat: boolean
  hasUrgency: boolean
  hasVulnerability: boolean
  hasLocation: boolean
  hasTiming: boolean
  hasPerpetrator: boolean
  hasPhysicalContact: boolean
  hasEmotionalDistress: boolean
  hasComplexTrauma: boolean // New indicator for complex trauma patterns
}

interface ConversationProgress {
  hasName: boolean
  hasAge: boolean
  hasTiming: boolean
  hasLocation: boolean
  hasNarrative: boolean
  hasDisability: boolean
  hasContact: boolean
  hasSuspect: boolean
  hasWitnesses: boolean
  hasEvidence: boolean
}

export class SecureNLPPipeline {
  private static instance: SecureNLPPipeline
  private stateManager: ConversationStateManager
  private semanticNLP: SemanticNLP

  static getInstance(): SecureNLPPipeline {
    if (!SecureNLPPipeline.instance) {
      SecureNLPPipeline.instance = new SecureNLPPipeline()
    }
    return SecureNLPPipeline.instance
  }

  private constructor() {
    this.stateManager = ConversationStateManager.getInstance()
    this.semanticNLP = SemanticNLP.getInstance()
  }

  // SECURITY: Enhanced input sanitization to prevent any data leakage
  private sanitizeInput(text: string): string {
    // Remove any potential script tags, dangerous content, or sensitive patterns
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim()
  }

  // SECURITY: No logging of sensitive content
  private safeLog(message: string, data?: any) {
    // Only log non-sensitive metadata, never user content
    if (data && typeof data === 'object') {
      const safeData = { ...data }
      // Remove any potentially sensitive fields
      delete safeData.extractedData
      delete safeData.response
      console.log(message, safeData)
    } else {
      console.log(message)
    }
  }

  // Enhanced relative time parsing
  private parseRelativeTime(text: string): { start_day?: string; start_month?: string; start_year?: string; start_time?: string } {
    const lowerText = text.toLowerCase()
    const now = new Date()
    let targetDate = new Date(now)
    
    // Handle relative time expressions
    if (lowerText.includes('yesterday')) {
      targetDate.setDate(now.getDate() - 1)
    } else if (lowerText.includes('day before yesterday')) {
      targetDate.setDate(now.getDate() - 2)
    } else if (lowerText.includes('last night')) {
      targetDate.setDate(now.getDate() - 1)
      targetDate.setHours(20, 0, 0, 0) // 8 PM
    } else if (lowerText.includes('this morning')) {
      targetDate.setHours(9, 0, 0, 0) // 9 AM
    } else if (lowerText.includes('this afternoon')) {
      targetDate.setHours(14, 0, 0, 0) // 2 PM
    } else if (lowerText.includes('this evening')) {
      targetDate.setHours(18, 0, 0, 0) // 6 PM
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
      targetDate.setHours(20, 0, 0, 0) // 8 PM
    }

    // Extract specific time if mentioned
    let timeString: string | undefined
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /at\s*(\d{1,2}):(\d{2})/i,
      /around\s*(\d{1,2}):(\d{2})/i
    ]
    
    for (const pattern of timePatterns) {
      const match = lowerText.match(pattern)
      if (match) {
        let hours = parseInt(match[1])
        const minutes = match[2] ? parseInt(match[2]) : 0
        const period = match[3]?.toLowerCase()
        
        if (period === 'pm' && hours !== 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0
        
        targetDate.setHours(hours, minutes, 0, 0)
        timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        break
      }
    }

    return {
      start_day: targetDate.getDate().toString(),
      start_month: (targetDate.getMonth() + 1).toString(),
      start_year: targetDate.getFullYear().toString(),
      start_time: timeString
    }
  }

  private detectTraumaIndicators(text: string): TraumaIndicators {
    const lowerText = text.toLowerCase()
    
    // Enhanced trauma detection patterns
    const complexTraumaPatterns = [
      /(?:kept|keeps|kept me|keeps me|wouldn't let|would not let|trapped|stuck|couldn't leave|could not leave)/i,
      /(?:followed|following|stalked|stalking|watched|watching|kept appearing|kept showing up)/i,
      /(?:threatened|threatening|said they would|said he would|said she would|warned|warning)/i,
      /(?:touched|touching|grabbed|grabbing|held|holding|pushed|pushing|pulled|pulling)/i,
      /(?:hurt|hurting|pain|painful|injured|injury|bruised|bruising|cut|cutting)/i,
      /(?:scared|terrified|frightened|panicked|anxious|worried|nervous|shocked|traumatized)/i,
      /(?:alone|by myself|on my own|without help|no one around|nobody there)/i,
      /(?:vulnerable|weak|helpless|powerless|couldn't fight|could not fight|couldn't move)/i
    ]
    
    const hasComplexTrauma = complexTraumaPatterns.some(pattern => pattern.test(lowerText))
    
    return {
      hasIncident: /(?:assault|attack|abuse|harassment|incident|situation|happened|occurred|took place|went through|man came up|approached|guy came up|person came up)/i.test(lowerText),
      hasThreat: /(?:hurt|kill|threaten|scared|afraid|terrified|dangerous|fear|worried|threatening|said they would|said he would|said she would)/i.test(lowerText),
      hasUrgency: /(?:now|immediately|urgent|emergency|help|need|want|please|can't speak|can speak|right now|asap|quickly)/i.test(lowerText),
      hasVulnerability: /(?:wheelchair|disability|alone|vulnerable|weak|difficult|hard|struggling|can't|cannot|15|fifteen|young|mum|mom|parent|guardian|toilet|waiting|by myself|on my own|helpless|powerless)/i.test(lowerText),
      hasLocation: /(?:in|at|near|around|central|street|area|place|location|where|outside|inside|building|shop|store|park|station|bus|train)/i.test(lowerText),
      hasTiming: /(?:yesterday|today|last|week|month|ago|when|time|date|morning|afternoon|evening|night|tonight|this morning|this afternoon|this evening|last night|few days|couple of days|hour|hours|minutes)/i.test(lowerText),
      hasPerpetrator: /(?:he|she|they|man|woman|guy|person|someone|attacker|perpetrator|suspect|stranger|unknown|didn't know|did not know)/i.test(lowerText),
      hasPhysicalContact: /(?:touch|touched|grab|grabbed|hold|held|push|pushed|pull|pulled|force|forced|hit|hitting|slap|slapping|punch|punching)/i.test(lowerText),
      hasEmotionalDistress: /(?:scared|afraid|terrified|shocked|traumatized|upset|angry|sad|depressed|anxious|panic|crying|cried|tears|emotional|distressed|overwhelmed)/i.test(lowerText),
      hasComplexTrauma
    }
  }

  private analyzeSentiment(text: string): number {
    try {
      const words = text.toLowerCase().split(/\s+/)
      let sentiment = 0
      let traumaIntensity = 0
      
      // Enhanced trauma-sensitive sentiment dictionary
      const positiveWords = ['help', 'support', 'safe', 'better', 'okay', 'alright', 'good', 'fine', 'relief', 'hope', 'thankful', 'grateful', 'protected', 'comforted']
      const negativeWords = ['hurt', 'pain', 'scared', 'afraid', 'terrible', 'bad', 'awful', 'horrible', 'attack', 'assault', 'violence', 'abuse', 'trauma', 'shock', 'terrified', 'terrifying', 'nightmare', 'worst']
      
      // High-intensity trauma words (weighted more heavily)
      const highIntensityWords = ['terrified', 'terrifying', 'traumatized', 'assaulted', 'attacked', 'violated', 'threatened', 'stalked', 'trapped', 'helpless', 'powerless', 'nightmare', 'worst', 'horrible', 'awful']
      
      words.forEach(word => {
        if (positiveWords.includes(word)) sentiment += 0.2
        if (negativeWords.includes(word)) sentiment -= 0.4
        if (highIntensityWords.includes(word)) {
          sentiment -= 0.6
          traumaIntensity += 0.3
        }
      })
      
      // Context-based sentiment adjustments
      if (text.match(/alone|by myself|on my own/i)) sentiment -= 0.3
      if (text.match(/wheelchair|disability|mobility/i)) sentiment -= 0.2
      if (text.match(/young|teen|teenager|15|fifteen/i)) sentiment -= 0.2
      if (text.match(/help|support|safe|protected/i)) sentiment += 0.3
      
      // Trauma intensity modifier
      sentiment -= traumaIntensity
      
      // Normalize to -1 to 1 scale
      return Math.max(-1, Math.min(1, sentiment))
    } catch (error) {
      console.warn('Sentiment analysis failed, defaulting to neutral:', error)
      return 0
    }
  }

  private classifyIntentWithContext(text: string, indicators: TraumaIndicators): string {
    const lowerText = text.toLowerCase()
    
    // Check for simple name responses first - but exclude common words
    const commonWords = ['yesterday', 'today', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'tonight', 'week', 'month', 'year', 'ago', 'now', 'then', 'here', 'there', 'where', 'when', 'what', 'how', 'why', 'yes', 'no', 'okay', 'fine', 'good', 'bad', 'well', 'ill', 'sick', 'hurt', 'pain', 'scared', 'afraid', 'alone', 'help', 'please', 'thank', 'sorry', 'excuse', 'pardon']
    if (/^[a-zA-Z]+$/.test(text.trim()) && text.length > 2 && text.length < 20 && !commonWords.includes(lowerText)) {
      return 'provide_personal_info'
    }
    
    // Check for simple age responses
    if (/^\d+$/.test(text.trim()) && parseInt(text) >= 1 && parseInt(text) <= 120) {
      return 'provide_personal_info'
    }
    
    // Check for timing-only responses (like "yesterday", "last week", etc.)
    if (indicators.hasTiming && !indicators.hasIncident && !indicators.hasLocation && !indicators.hasPerpetrator) {
      return 'provide_timing_info'
    }
    
    // Check for incident continuation (when user provides more details about what happened)
    if (indicators.hasIncident && (indicators.hasPerpetrator || text.match(/called me|said|told me|shouted|yelled|insulted|abused|harassed|whore|slut|bitch|stupid|idiot|ugly|fat|worthless|useless/i))) {
      return 'continue_incident_narrative'
    }
    
    // High-priority trauma detection for direct victims
    if (indicators.hasIncident && (indicators.hasThreat || indicators.hasPhysicalContact)) {
      return 'report_incident'
    }
    
    // Complex trauma patterns
    if (indicators.hasComplexTrauma) {
      return 'report_incident'
    }
    
    // Help requests with vulnerability
    if (indicators.hasUrgency && indicators.hasVulnerability) {
      return 'request_help'
    }
    
    // Personal information for direct victims
    if (lowerText.match(/(?:name|call|am|is|i'm|i am|im)/) && !indicators.hasIncident) {
      return 'provide_personal_info'
    }
    
    // Timing information for direct victims
    if (indicators.hasTiming && indicators.hasIncident) {
      return 'provide_timing_info'
    }
    
    // Location information for direct victims
    if (indicators.hasLocation && indicators.hasIncident) {
      return 'provide_location_info'
    }
    
    // Perpetrator information for direct victims
    if (indicators.hasPerpetrator && indicators.hasIncident) {
      return 'provide_suspect_info'
    }
    
    // General conversation (fallback)
    return 'general_conversation'
  }

  private extractDataWithContext(text: string, intent: string, indicators: TraumaIndicators): Record<string, any> {
    const extracted: Record<string, any> = {}

    // Extract names with better context
    if (intent === 'provide_personal_info' || !indicators.hasIncident) {
      const namePatterns = [
        /my name is ([^.!?]+)/i,
        /i'm ([^.!?]+)/i,
        /call me ([^.!?]+)/i,
        /i am ([^.!?]+)/i,
        /hi,? i'm ([^.!?]+)/i,
        /hello,? i'm ([^.!?]+)/i,
        /im ([^.!?]+)/i,
        /^([a-zA-Z]+)$/i // Single word response (like "dorothy")
      ]
      
      for (const pattern of namePatterns) {
        const match = text.match(pattern)
        if (match && !extracted.first_name) {
          const fullName = match[1].trim()
          const nameParts = fullName.split(' ')
          extracted.first_name = nameParts[0] || ''
          extracted.surname = nameParts.slice(1).join(' ') || ''
          break
        }
      }
    }

    // Extract emails
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
    if (emailMatch) {
      extracted.email = emailMatch[0]
    }

    // Extract phone numbers
    const phoneMatch = text.match(/(\+?[\d\s\-\(\)]{10,})/)
    if (phoneMatch) {
      extracted.phone_number = phoneMatch[1].replace(/\s+/g, '')
    }

    // Extract age with better patterns
    const agePatterns = [
      /i'm (\d+)/i,
      /i am (\d+)/i,
      /(\d+) years old/i,
      /i'm (\d+) years/i,
      /i am (\d+) years/i,
      /age (\d+)/i,
      /^(\d+)$/i // Simple number response (like "17")
    ]
    
    for (const pattern of agePatterns) {
      const match = text.match(pattern)
      if (match && !extracted.age) {
        const age = parseInt(match[1])
        if (age >= 1 && age <= 120) { // Reasonable age range
          extracted.age = match[1]
          break
        }
      }
    }

    // Extract timing information with relative time parsing
    if (indicators.hasTiming) {
      const relativeTime = this.parseRelativeTime(text)
      if (relativeTime.start_day) {
        Object.assign(extracted, relativeTime)
      }
      
      // Also extract specific date patterns
      const datePatterns = [
        /born on (\d{1,2})\/(\d{1,2})\/(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
        /(\d{1,2})-(\d{1,2})-(\d{4})/i
      ]
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern)
        if (match && !extracted.dob_day) {
          extracted.dob_day = match[1]
          extracted.dob_month = match[2]
          extracted.dob_year = match[3]
          break
        }
      }
    }

    // Extract vulnerability context
    if (indicators.hasVulnerability) {
      const vulnerabilityPatterns = [
        /i was alone/i,
        /i'm alone/i,
        /i am alone/i,
        /by myself/i,
        /on my own/i,
        /without my mum/i,
        /without my mom/i,
        /without my parent/i,
        /mum went to/i,
        /mom went to/i,
        /parent went to/i,
        /guardian went to/i,
        /no one around/i,
        /nobody there/i,
        /helpless/i,
        /powerless/i
      ]
      
      for (const pattern of vulnerabilityPatterns) {
        if (text.match(pattern)) {
          extracted.vulnerability_context = 'alone'
          extracted.alone_when_incident = 'Yes'
          break
        }
      }
    }

    // Extract locations with enhanced context
    if (indicators.hasLocation) {
      const locationPatterns = [
        /i live in ([^.!?]+)/i,
        /my address is ([^.!?]+)/i,
        /i'm from ([^.!?]+)/i,
        /it happened in ([^.!?]+)/i,
        /i was in ([^.!?]+)/i,
        /central ([^.!?]+)/i,
        /([^.!?]*london[^.!?]*)/i,
        /([^.!?]*joburg[^.!?]*)/i,
        /([^.!?]*cape town[^.!?]*)/i,
        /waiting (?:outside|in|at) ([^.!?]+)/i,
        /(?:outside|in|at) the ([^.!?]+)/i,
        /at the ([^.!?]+)/i,
        /in the ([^.!?]+)/i,
        /near the ([^.!?]+)/i,
        /around the ([^.!?]+)/i
      ]
      
      for (const pattern of locationPatterns) {
        const match = text.match(pattern)
        if (match && !extracted.town_city) {
          const location = match[1].trim()
          const cleanLocation = location.replace(/^(central\s+|i was in\s+|it happened in\s+)/i, '')
          extracted.town_city = cleanLocation
          
          // Extract location type based on context, not hard-coded places
          if (text.match(/toilet|bathroom|restroom/i)) {
            extracted.incident_location_detail = 'Near public toilets'
          }
          if (text.match(/shop|store|mall|shopping/i)) {
            extracted.incident_location_detail = 'Shopping area'
          }
          if (text.match(/park|garden|playground/i)) {
            extracted.incident_location_detail = 'Park or public space'
          }
          if (text.match(/station|bus|train|transport/i)) {
            extracted.incident_location_detail = 'Transport hub'
          }
          if (text.match(/street|road|avenue/i)) {
            extracted.incident_location_detail = 'Street or road'
          }
          if (text.match(/building|office|workplace/i)) {
            extracted.incident_location_detail = 'Building or workplace'
          }
          break
        }
      }
    }

    // Extract health/mobility issues with enhanced context
    if (indicators.hasVulnerability) {
      const healthPatterns = [
        /i'm in a wheelchair/i,
        /wheelchair/i,
        /disability/i,
        /mobility issues/i,
        /health issues/i,
        /medical condition/i,
        /difficult for me/i,
        /hard for me/i,
        /struggling/i,
        /can't move/i,
        /cannot move/i,
        /limited mobility/i
      ]
      
      for (const pattern of healthPatterns) {
        if (text.match(pattern)) {
          extracted.disability = 'Yes'
          extracted.health_issues = 'Yes'
          const healthMatch = text.match(/(?:i'm in a|i have|i am|wheelchair|disability|mobility|health|difficult|hard|struggling|can't move|cannot move|limited)[^.!?]*/i)
          if (healthMatch) {
            extracted.health_issues_details = healthMatch[0].trim()
          }
          break
        }
      }
      
      // Extract wheelchair specifically
      if (text.match(/wheelchair/i)) {
        extracted.disability = 'Yes'
        extracted.health_issues = 'Yes'
        extracted.health_issues_details = 'Uses wheelchair'
      }
    }

    // Extract incident narrative with enhanced patterns
    if (indicators.hasIncident) {
      const incidentPatterns = [
        /(?:guy|man|person) came up (?:to me|towards me)/i,
        /(?:guy|man|person) approached (?:me|towards me)/i,
        /(?:guy|man|person) walked up (?:to me|towards me)/i,
        /(?:guy|man|person) came over (?:to me|towards me)/i,
        /(?:guy|man|person) started (?:following|stalking|watching)/i,
        /(?:guy|man|person) kept (?:following|appearing|showing up)/i,
        /(?:guy|man|person) trapped (?:me|us)/i,
        /(?:guy|man|person) wouldn't let (?:me|us) (?:leave|go|move)/i,
        /(?:guy|man|person) threatened (?:me|us)/i,
        /(?:guy|man|person) said (?:they|he|she) would (?:hurt|kill|harm)/i
      ]
      
      for (const pattern of incidentPatterns) {
        if (text.match(pattern)) {
          extracted.incident_narrative = 'Someone approached me'
          break
        }
      }
      
      // Extract more specific incident details
      if (text.match(/touched|grabbed|held|pushed|pulled/i)) {
        extracted.incident_narrative = 'Physical contact occurred'
      }
      if (text.match(/threatened|said they would|said he would|said she would/i)) {
        extracted.incident_narrative = 'Threats were made'
      }
      if (text.match(/followed|stalking|watching/i)) {
        extracted.incident_narrative = 'Someone was following me'
      }
      if (text.match(/trapped|wouldn't let|couldn't leave/i)) {
        extracted.incident_narrative = 'I was trapped or prevented from leaving'
      }
      // Handle verbal abuse and harassment
      if (text.match(/called me|said|told me|shouted|yelled|insulted|abused|harassed/i)) {
        extracted.incident_narrative = 'Verbal abuse or harassment occurred'
      }
      // Handle specific offensive language patterns
      if (text.match(/whore|slut|bitch|stupid|idiot|ugly|fat|worthless|useless/i)) {
        extracted.incident_narrative = 'Offensive language was used'
      }
      // Handle physical violence
      if (text.match(/hit|punch|slap|kick|strike|beat|attack/i)) {
        extracted.incident_narrative = 'Physical violence occurred'
      }
      // Handle physical contact
      if (text.match(/touched|grabbed|held|pushed|pulled|force|forced/i)) {
        extracted.incident_narrative = 'Physical contact occurred'
      }
    }

    return extracted
  }

  private assessTraumaRisk(indicators: TraumaIndicators, intent: string, extractedData: Record<string, any>): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // Trauma indicators
    if (indicators.hasIncident) riskScore += 3
    if (indicators.hasThreat) riskScore += 3
    if (indicators.hasUrgency) riskScore += 2
    if (indicators.hasVulnerability) riskScore += 2
    if (indicators.hasPhysicalContact) riskScore += 3
    if (indicators.hasEmotionalDistress) riskScore += 2
    if (indicators.hasComplexTrauma) riskScore += 4 // Higher weight for complex trauma

    // Intent-based risk
    if (intent === 'report_incident') riskScore += 3
    if (intent === 'request_help') riskScore += 2

    // Content-based risk (check for specific high-risk words)
    const highRiskWords = ['hurt', 'kill', 'threaten', 'scared', 'afraid', 'terrified', 'dangerous', 'force', 'forced', 'trapped', 'helpless', 'powerless', 'stalked', 'violated']
    const text = JSON.stringify(extractedData).toLowerCase()
    highRiskWords.forEach(word => {
      if (text.includes(word)) riskScore += 2
    })

    // Data completeness risk
    const hasPersonalInfo = extractedData.first_name || extractedData.email || extractedData.phone_number
    if (!hasPersonalInfo) riskScore += 1

    // Age-based risk (minors are higher risk)
    if (extractedData.age && parseInt(extractedData.age) < 18) riskScore += 2

    // Disability-based risk
    if (extractedData.disability === 'Yes') riskScore += 1

    if (riskScore >= 10) return 'high'
    if (riskScore >= 5) return 'medium'
    return 'low'
  }

  private generateResponse(intent: string, riskLevel: 'low' | 'medium' | 'high'): string {
    const responses = {
      report_incident: {
        low: "I understand you're sharing something difficult that happened to you. Let's take this step by step. Can you tell me your name?",
        medium: "I hear you, and I want to help. This is a safe space. Can you start by telling me your name?",
        high: "I'm here to listen and support you. You're not alone. Let's begin with your name - what would you like me to call you?"
      },
      request_help: {
        low: "I'm here to help you. What kind of support do you need right now?",
        medium: "I want to help you get the support you need. Can you tell me more about what happened to you?",
        high: "You're reaching out for help, and that's brave. I'm here to support you. Can you tell me what you're going through?"
      },
      provide_personal_info: {
        low: "Thank you for sharing that. Can you tell me more about what happened to you?",
        medium: "Thank you. Now, can you tell me about the incident you experienced?",
        high: "Thank you for trusting me with that information. I'm here to help you through this process."
      },
      provide_timing_info: {
        low: "Thank you for that information. Can you tell me where this happened to you?",
        medium: "I understand the timing. Can you tell me more about the location where this occurred?",
        high: "Thank you for sharing when this occurred. I'm here to help you document everything."
      },
      provide_location_info: {
        low: "Thank you. Can you tell me more about what happened to you there?",
        medium: "I understand the location. Can you describe what occurred?",
        high: "Thank you for that detail. I want to help you document what happened."
      },
      provide_suspect_info: {
        low: "Thank you for that information. Can you tell me more about what happened to you?",
        medium: "I understand. Can you describe what happened in more detail?",
        high: "Thank you for sharing that. Can you tell me more about the incident?"
      },
      continue_incident_narrative: {
        low: "I understand what happened. Can you tell me more about the incident? What else occurred?",
        medium: "Thank you for sharing that detail. Can you tell me more about what happened?",
        high: "I understand what they did. Can you tell me more about the incident? Take your time."
      },
      general_conversation: {
        low: "I'm here to listen. Can you tell me more about what you'd like to discuss?",
        medium: "I'm here to support you. What would you like to talk about?",
        high: "I'm here for you. This is a safe space to share what you're going through."
      }
    }

    // Enhanced responses for high-risk situations
    if (riskLevel === 'high') {
      const highRiskResponses = {
        report_incident: "I'm here to listen and support you. You're not alone in this. Are you currently in a safe place?",
        request_help: "You're reaching out for help, and that's very brave. I'm here to support you. Are you safe right now?",
        provide_personal_info: "Thank you for trusting me with that information. I'm here to help you through this process. How are you feeling right now?",
        provide_timing_info: "Thank you for sharing when this occurred. I'm here to help you document everything. Are you okay to continue?",
        provide_location_info: "Thank you for that detail. I want to help you document what happened. Take your time - there's no rush.",
        provide_suspect_info: "Thank you for sharing that. I'm here to help you through this difficult process. How are you holding up?",
        general_conversation: "I'm here for you. This is a safe space to share what you're going through. You don't have to face this alone."
      }
      
      return highRiskResponses[intent as keyof typeof highRiskResponses] || 
             "I'm here for you. This is a safe space to share what you're going through."
    }

    // More specific responses based on intent
    const specificResponses = {
      report_incident: {
        low: "I understand you're sharing something difficult that happened to you. Can you tell me when this occurred?",
        medium: "I hear you, and I want to help. Can you tell me more about the timing of this incident?",
        high: "I'm here to listen and support you. When did this incident occur?"
      },
      request_help: {
        low: "I'm here to help you. What specific support do you need right now?",
        medium: "I want to help you get the support you need. What happened that made you reach out?",
        high: "You're reaching out for help, and that's brave. What can I help you with?"
      },
      provide_personal_info: {
        low: "Thank you for sharing that. Can you tell me about the incident you experienced?",
        medium: "Thank you. Now, can you describe what happened to you?",
        high: "Thank you for trusting me with that information. Can you tell me about the incident?"
      },
      provide_timing_info: {
        low: "Thank you for that information. Can you tell me where this happened to you?",
        medium: "I understand the timing. Can you tell me the location where this occurred?",
        high: "Thank you for sharing when this occurred. Where did this incident take place?"
      },
      provide_location_info: {
        low: "Thank you. Can you tell me more about what happened to you at that location?",
        medium: "I understand the location. Can you describe the incident in more detail?",
        high: "Thank you for that detail. Can you tell me what happened there?"
      },
      provide_suspect_info: {
        low: "Thank you for that information. Can you tell me more about what happened to you?",
        medium: "I understand. Can you describe what happened in more detail?",
        high: "Thank you for sharing that. Can you tell me more about the incident?"
      },
      continue_incident_narrative: {
        low: "I understand what happened. Can you tell me more about the incident? What else occurred?",
        medium: "Thank you for sharing that detail. Can you tell me more about what happened?",
        high: "I understand what they did. Can you tell me more about the incident? Take your time."
      },
      general_conversation: {
        low: "I'm here to listen. What would you like to discuss?",
        medium: "I'm here to support you. What's on your mind?",
        high: "I'm here for you. What would you like to talk about?"
      }
    }

    return specificResponses[intent as keyof typeof specificResponses]?.[riskLevel] || 
           responses[intent as keyof typeof responses]?.[riskLevel] ||
           "I'm here to listen and help. Can you tell me more about what you'd like to discuss?"
  }

  private calculateConfidence(indicators: TraumaIndicators, intent: string, extractedData: Record<string, any>, text: string): number {
    let confidence = 0.5 // Base confidence
    
    // Boost confidence for clear patterns
    const clearPatterns = [
      /my name is/i,
      /i'm \d+/i,
      /i am \d+/i,
      /wheelchair/i,
      /alone/i,
      /mum|mom|parent/i,
      /man came up/i,
      /approached/i
    ]
    
    const patternMatches = clearPatterns.filter(pattern => pattern.test(text)).length
    confidence += patternMatches * 0.1
    
    // Boost for extracted data quality
    const hasName = extractedData.first_name || extractedData.surname
    const hasAge = extractedData.age
    const hasDisability = extractedData.disability
    const hasVulnerability = extractedData.vulnerability_context
    
    if (hasName) confidence += 0.15
    if (hasAge) confidence += 0.1
    if (hasDisability) confidence += 0.1
    if (hasVulnerability) confidence += 0.1
    
    // Boost for clear intent
    if (intent !== 'general_conversation') confidence += 0.1
    
    // Boost for trauma indicators
    const traumaIndicators = Object.values(indicators).filter(Boolean).length
    confidence += traumaIndicators * 0.05
    
    // Cap at 0.95 (never 100% confident with pattern matching)
    return Math.min(0.95, confidence)
  }

  private generateIntelligentResponse(intent: string, riskLevel: 'low' | 'medium' | 'high', extractedData: Record<string, any>, text: string, indicators: TraumaIndicators): string {
    const state = this.stateManager.getState()
    
    // PRIORITY 1: Handle newly extracted data with intelligent acknowledgment
    if (Object.keys(extractedData).length > 0) {
      // Name extraction
      if (extractedData.first_name && !state.progress.hasAge) {
        return `Thank you ${extractedData.first_name}. How old are you? This helps us provide appropriate support.`
      }
      
      // Age extraction
      if (extractedData.age && state.progress.hasName && !state.progress.hasTiming) {
        return "When did this happen? You can say things like 'yesterday', 'last week', 'this morning', or give me a specific date and time."
      }
      
      // Timing extraction
      if (extractedData.start_day && state.progress.hasName && state.progress.hasAge && !state.progress.hasLocation) {
        let timingAck = "I understand when this happened"
        if (extractedData.start_time) {
          timingAck += ` at ${extractedData.start_time}`
        }
        return `${timingAck}. Can you tell me where this occurred?`
      }
      
      // Location extraction
      if (extractedData.town_city && state.progress.hasTiming && !state.progress.hasNarrative) {
        return `I understand you were in ${extractedData.town_city}. Can you tell me what happened? What did this person do or say?`
      }
      
      // Incident narrative extraction
      if (extractedData.incident_narrative && !state.progress.hasEvidence) {
        return "Thank you for sharing that. Do you have any photos, videos, or other evidence from the incident?"
      }
      
      // Contact information extraction
      if ((extractedData.email || extractedData.phone_number) && !state.progress.hasContact) {
        return "Thank you for providing your contact information. Is there anything else you'd like to add about what happened?"
      }
    }
    
    // PRIORITY 2: Handle incident narrative continuation (when user provides more details)
    if (indicators.hasIncident && state.progress.hasLocation && !state.progress.hasNarrative) {
      // User is providing incident details after location
      if (text.match(/called me|said|told me|shouted|yelled/i)) {
        return "I understand what they said to you. Can you tell me more about what happened? Did they do anything else besides saying those things?"
      }
      if (text.match(/touched|grabbed|pushed|pulled|hit/i)) {
        return "I understand there was physical contact. Can you tell me more about what happened? What did they do exactly?"
      }
      return "Thank you for sharing that. Can you tell me more about what happened? What else did this person do or say?"
    }
    
    // PRIORITY 2.5: Handle incident narrative when user has already provided some details
    if (indicators.hasIncident && state.progress.hasLocation && state.progress.hasNarrative) {
      // User is providing additional incident details
      if (text.match(/hit|punch|slap|kick/i)) {
        return "I understand there was physical violence. This is very serious. Do you have any photos, videos, or other evidence from the incident?"
      }
      if (text.match(/threatened|said they would|said he would|said she would/i)) {
        return "I understand there were threats involved. Do you have any evidence or witnesses who saw what happened?"
      }
      return "Thank you for sharing those additional details. Do you have any photos, videos, or other evidence from the incident?"
    }
    
    // PRIORITY 3: Handle high-risk trauma patterns with appropriate sensitivity
    if (indicators.hasComplexTrauma) {
      if (text.match(/trapped|wouldn't let|couldn't leave/i)) {
        return "That sounds like a very frightening experience. You're being very brave by sharing this. Can you tell me more about what happened when you felt trapped?"
      }
      if (text.match(/followed|stalking|watching/i)) {
        return "Being followed or watched is very scary and violating. Can you tell me more about what happened when you noticed someone following you?"
      }
      if (text.match(/threatened|said they would/i)) {
        return "Threats are very serious and frightening. I want you to know you're safe here. Can you tell me what happened when this person threatened you?"
      }
    }
    
    // PRIORITY 4: Handle vulnerability context with appropriate sensitivity
    if (extractedData.vulnerability_context === 'alone' && extractedData.age && parseInt(extractedData.age) < 18) {
      if (extractedData.disability === 'Yes') {
        return "I understand you're young, use a wheelchair, and were alone when something happened. That must have been really difficult and scary. Can you tell me what occurred when you were by yourself? You're being very brave by sharing this."
      } else {
        return "I understand you're young and were alone when something happened. That must have been really difficult and scary. Can you tell me what occurred when you were by yourself? You're being very brave by sharing this."
      }
    }
    
    // PRIORITY 5: Ask for missing information based on CONVERSATION STATE (not just current message)
    const missingInfo = this.getMissingInformationFromState(state)
    if (missingInfo.length > 0) {
      const nextInfo = missingInfo[0]
      return this.getQuestionForMissingInfo(nextInfo, state.extractedData)
    }
    
    // PRIORITY 6: Fallback to intent-based responses
    return this.generateResponse(intent, riskLevel)
  }

  private getMissingInformationFromState(state: any): string[] {
    const missing: string[] = []
    
    // Priority order for information gathering based on conversation state
    if (!state.progress.hasName) missing.push('name')
    if (!state.progress.hasAge) missing.push('age')
    if (!state.progress.hasTiming) missing.push('timing')
    if (!state.progress.hasLocation) missing.push('location')
    if (!state.progress.hasNarrative) missing.push('narrative')
    if (!state.progress.hasDisability) missing.push('disability')
    if (!state.progress.hasContact) missing.push('contact')
    
    return missing
  }

  private getQuestionForMissingInfo(infoType: string, extractedData: Record<string, any>): string {
    switch (infoType) {
      case 'name':
        return "Can you tell me your name? What would you like me to call you?"
      case 'age':
        return "How old are you? This helps us provide appropriate support."
      case 'timing':
        return "When did this happen? You can say things like 'yesterday', 'last week', 'this morning', or give me a specific date and time."
      case 'location':
        return "Where did this happen? Can you tell me the location or area?"
      case 'narrative':
        return "Can you tell me what happened? What did this person do or say?"
      case 'disability':
        return "Do you have any mobility needs or health conditions we should know about?"
      case 'contact':
        return "How would you prefer to be contacted about next steps? Email or phone?"
      default:
        return "Can you tell me more about what happened?"
    }
  }

  async processInput(text: string): Promise<ProcessedInput> {
    const sanitized = this.sanitizeInput(text)
    const indicators = this.detectTraumaIndicators(sanitized)
    const sentiment = this.analyzeSentiment(sanitized)
    
    // Use semantic NLP for intent classification and data extraction
    let intent: string
    let extractedData: Record<string, any>
    let confidence: number
    
    try {
      const semanticResult = await this.semanticNLP.classifyIntent(sanitized)
      intent = semanticResult.intent
      extractedData = semanticResult.extractedData
      confidence = semanticResult.confidence
      
      // If semantic NLP didn't extract data, fall back to pattern matching
      if (Object.keys(extractedData).length === 0) {
        const fallbackIntent = this.classifyIntentWithContext(sanitized, indicators)
        const fallbackData = this.extractDataWithContext(sanitized, fallbackIntent, indicators)
        
        // Use semantic intent if it's more specific than fallback
        if (intent === 'general_conversation' && fallbackIntent !== 'general_conversation') {
          intent = fallbackIntent
          extractedData = fallbackData
        } else {
          // Merge extracted data
          Object.assign(extractedData, fallbackData)
        }
      }
    } catch (error) {
      console.warn('Semantic NLP failed, using fallback:', error)
      intent = this.classifyIntentWithContext(sanitized, indicators)
      extractedData = this.extractDataWithContext(sanitized, intent, indicators)
      confidence = this.calculateConfidence(indicators, intent, extractedData, sanitized)
    }
    
    const riskLevel = this.assessTraumaRisk(indicators, intent, extractedData)
    
    // Update conversation state with new data
    this.stateManager.updateState(extractedData)
    
    // Get the next question based on current state
    const { question: nextQuestion, stage } = this.stateManager.getNextQuestion()
    
    // Generate intelligent response (this is the single source of truth for responses)
    const response = this.generateIntelligentResponse(intent, riskLevel, extractedData, sanitized, indicators)

    // SECURITY: Log only non-sensitive metadata
    this.safeLog('Processing completed', {
      intent,
      riskLevel,
      confidence: confidence.toFixed(2),
      hasExtractedData: Object.keys(extractedData).length > 0,
      currentStage: stage,
      hasComplexTrauma: indicators.hasComplexTrauma,
      method: 'semantic_nlp'
    })

    const responseId = Date.now().toString()

    return {
      sentiment,
      intent,
      extractedData,
      riskLevel,
      response,
      indicators,
      confidence,
      responseId,
      nextQuestion,
      progress: this.stateManager.getState().progress
    }
  }
} 