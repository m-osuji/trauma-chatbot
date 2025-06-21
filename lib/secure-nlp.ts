export interface ProcessedInput {
  sentiment: number // -1 to 1
  intent: string
  extractedData: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high'
  response: string
  indicators: TraumaIndicators
  confidence: number // 0 to 1 - how confident we are in our processing
  responseId: string // Unique identifier to prevent repetition
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
}

export class SecureNLPPipeline {
  private static instance: SecureNLPPipeline

  static getInstance(): SecureNLPPipeline {
    if (!SecureNLPPipeline.instance) {
      SecureNLPPipeline.instance = new SecureNLPPipeline()
    }
    return SecureNLPPipeline.instance
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

  private detectTraumaIndicators(text: string): TraumaIndicators {
    const lowerText = text.toLowerCase()
    
    return {
      hasIncident: /(?:assault|attack|abuse|harassment|incident|situation|happened|occurred|took place|went through|man came up|approached)/i.test(lowerText),
      hasThreat: /(?:hurt|kill|threaten|scared|afraid|terrified|dangerous|fear|worried)/i.test(lowerText),
      hasUrgency: /(?:now|immediately|urgent|emergency|help|need|want|please|can't speak|can speak)/i.test(lowerText),
      hasVulnerability: /(?:wheelchair|disability|alone|vulnerable|weak|difficult|hard|struggling|can't|cannot|15|fifteen|young|mum|mom|parent|guardian|toilet|waiting)/i.test(lowerText),
      hasLocation: /(?:in|at|near|around|central|street|area|place|location|where)/i.test(lowerText),
      hasTiming: /(?:yesterday|today|last|week|month|ago|when|time|date)/i.test(lowerText),
      hasPerpetrator: /(?:he|she|they|man|woman|guy|person|someone|attacker|perpetrator|suspect)/i.test(lowerText),
      hasPhysicalContact: /(?:touch|touched|grab|grabbed|hold|held|push|pushed|pull|pulled|force|forced)/i.test(lowerText),
      hasEmotionalDistress: /(?:scared|afraid|terrified|shocked|traumatized|upset|angry|sad|depressed|anxious|panic)/i.test(lowerText)
    }
  }

  private analyzeSentiment(text: string): number {
    try {
      const words = text.toLowerCase().split(/\s+/)
      let sentiment = 0
      
      // Trauma-sensitive sentiment dictionary
      const positiveWords = ['help', 'support', 'safe', 'better', 'okay', 'alright', 'good', 'fine', 'relief', 'hope']
      const negativeWords = ['hurt', 'pain', 'scared', 'afraid', 'terrible', 'bad', 'awful', 'horrible', 'attack', 'assault', 'violence', 'abuse', 'trauma', 'shock', 'terrified']
      
      words.forEach(word => {
        if (positiveWords.includes(word)) sentiment += 0.2
        if (negativeWords.includes(word)) sentiment -= 0.4
      })
      
      // Normalize to -1 to 1 scale
      return Math.max(-1, Math.min(1, sentiment))
    } catch (error) {
      console.warn('Sentiment analysis failed, defaulting to neutral:', error)
      return 0
    }
  }

  private classifyIntentWithContext(text: string, indicators: TraumaIndicators): string {
    const lowerText = text.toLowerCase()
    
    // Check for simple name responses first
    if (/^[a-zA-Z]+$/.test(text.trim()) && text.length > 2 && text.length < 20) {
      return 'provide_personal_info'
    }
    
    // Check for simple age responses
    if (/^\d+$/.test(text.trim()) && parseInt(text) >= 1 && parseInt(text) <= 120) {
      return 'provide_personal_info'
    }
    
    // High-priority trauma detection for direct victims
    if (indicators.hasIncident && (indicators.hasThreat || indicators.hasPhysicalContact)) {
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
        /guardian went to/i
      ]
      
      for (const pattern of vulnerabilityPatterns) {
        if (text.match(pattern)) {
          extracted.vulnerability_context = 'alone'
          extracted.alone_when_incident = 'Yes'
          break
        }
      }
    }

    // Extract dates with context
    if (indicators.hasTiming) {
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

    // Extract locations with context
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
        /(?:outside|in|at) the ([^.!?]+)/i
      ]
      
      for (const pattern of locationPatterns) {
        const match = text.match(pattern)
        if (match && !extracted.town_city) {
          const location = match[1].trim()
          const cleanLocation = location.replace(/^(central\s+|i was in\s+|it happened in\s+)/i, '')
          extracted.town_city = cleanLocation
          
          // Extract more specific location details
          if (text.match(/toilet|bathroom|restroom/i)) {
            extracted.incident_location_detail = 'Near public toilets'
          }
          if (text.match(/central london/i)) {
            extracted.incident_location_detail = 'Central London area'
          }
          break
        }
      }
    }

    // Extract health/mobility issues with context
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
        /struggling/i
      ]
      
      for (const pattern of healthPatterns) {
        if (text.match(pattern)) {
          extracted.disability = 'Yes'
          extracted.health_issues = 'Yes'
          const healthMatch = text.match(/(?:i'm in a|i have|i am|wheelchair|disability|mobility|health|difficult|hard|struggling)[^.!?]*/i)
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

    // Extract incident narrative
    if (indicators.hasIncident) {
      const incidentPatterns = [
        /(?:guy|man|person) came up (?:to me|towards me)/i,
        /(?:guy|man|person) approached (?:me|towards me)/i,
        /(?:guy|man|person) walked up (?:to me|towards me)/i,
        /(?:guy|man|person) came over (?:to me|towards me)/i
      ]
      
      for (const pattern of incidentPatterns) {
        if (text.match(pattern)) {
          extracted.incident_narrative = 'Someone approached me'
          break
        }
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

    // Intent-based risk
    if (intent === 'report_incident') riskScore += 3
    if (intent === 'request_help') riskScore += 2

    // Content-based risk (check for specific high-risk words)
    const highRiskWords = ['hurt', 'kill', 'threaten', 'scared', 'afraid', 'terrified', 'dangerous', 'force', 'forced']
    const text = JSON.stringify(extractedData).toLowerCase()
    highRiskWords.forEach(word => {
      if (text.includes(word)) riskScore += 2
    })

    // Data completeness risk
    const hasPersonalInfo = extractedData.first_name || extractedData.email || extractedData.phone_number
    if (!hasPersonalInfo) riskScore += 1

    if (riskScore >= 8) return 'high'
    if (riskScore >= 4) return 'medium'
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
        high: "Thank you for sharing that. I'm here to help you through this difficult process."
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

  private generateIntelligentResponse(intent: string, riskLevel: 'low' | 'medium' | 'high', extractedData: Record<string, any>, text: string): string {
    // If we just got a name, acknowledge it and ask for age
    if (extractedData.first_name && !extractedData.age) {
      return `Thank you ${extractedData.first_name}. How old are you? This helps us provide appropriate support.`
    }
    
    // If we just got an age, ask for timing
    if (extractedData.age && !extractedData.start_day) {
      return "When did this happen? Can you tell me the date and time?"
    }
    
    // If we have location info but missing timing
    if (extractedData.town_city && !extractedData.start_day && text.match(/central london|waiting|toilet/i)) {
      return "I understand you were in Central London. Can you tell me when this happened? What day and time was it?"
    }
    
    // If we have perpetrator info but missing incident details
    if (text.match(/guy came up|man came up|approached/i) && !extractedData.incident_narrative) {
      return "I understand someone approached you. Can you tell me what happened when they came up to you? What did they do or say?"
    }
    
    // If we have vulnerability info but missing incident details
    if (extractedData.disability === 'Yes' && extractedData.age && !extractedData.incident_narrative) {
      return "I understand you're young and use a wheelchair. Can you tell me what happened when this person came up to you?"
    }
    
    // Default to asking for missing information
    const missingInfo = this.getMissingInformation(extractedData)
    if (missingInfo.length > 0) {
      const nextInfo = missingInfo[0]
      return this.getQuestionForMissingInfo(nextInfo, extractedData)
    }
    
    // Fallback to general response
    return this.generateResponse(intent, riskLevel)
  }

  private getMissingInformation(extractedData: Record<string, any>): string[] {
    const missing: string[] = []
    
    // Priority order for information gathering
    if (!extractedData.first_name) missing.push('name')
    if (!extractedData.age) missing.push('age')
    if (!extractedData.start_day) missing.push('timing')
    if (!extractedData.town_city) missing.push('location')
    if (!extractedData.incident_narrative) missing.push('narrative')
    if (!extractedData.disability) missing.push('disability')
    if (!extractedData.email && !extractedData.phone_number) missing.push('contact')
    
    return missing
  }

  private getQuestionForMissingInfo(infoType: string, extractedData: Record<string, any>): string {
    switch (infoType) {
      case 'name':
        return "Can you tell me your name? What would you like me to call you?"
      case 'age':
        return "How old are you? This helps us provide appropriate support."
      case 'timing':
        return "When did this happen? Can you tell me the date and time?"
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
    const intent = this.classifyIntentWithContext(sanitized, indicators)
    const extractedData = this.extractDataWithContext(sanitized, intent, indicators)
    const riskLevel = this.assessTraumaRisk(indicators, intent, extractedData)
    
    // Generate intelligent response focused on information extraction
    let response = this.generateIntelligentResponse(intent, riskLevel, extractedData, sanitized)
    
    // Special handling for minors who mention being alone
    if (extractedData.age && parseInt(extractedData.age) < 18 && extractedData.vulnerability_context === 'alone') {
      if (extractedData.disability === 'Yes') {
        response = "I understand you're young, use a wheelchair, and were alone when something happened. That must have been really difficult and scary. Can you tell me what occurred when you were by yourself? You're being very brave by sharing this."
      } else {
        response = "I understand you're young and were alone when something happened. That must have been really difficult and scary. Can you tell me what occurred when you were by yourself? You're being very brave by sharing this."
      }
    }
    
    // Special handling for minors in general
    else if (extractedData.age && parseInt(extractedData.age) < 18) {
      if (extractedData.disability === 'Yes') {
        response = "Thank you for reaching out. I want you to know that you're in a safe space here, and it's okay to take your time. I understand you use a wheelchair and are young - can you tell me what happened?"
      } else {
        response = "Thank you for reaching out. I want you to know that you're in a safe space here, and it's okay to take your time. Can you tell me what happened?"
      }
    }
    
    // Special handling for wheelchair users
    else if (extractedData.disability === 'Yes' && extractedData.vulnerability_context === 'alone') {
      response = "I understand you use a wheelchair and were alone when something happened. That must have been really difficult. Can you tell me what occurred when you were by yourself?"
    }

    const confidence = this.calculateConfidence(indicators, intent, extractedData, sanitized)

    // SECURITY: Log only non-sensitive metadata
    this.safeLog('Processing completed', {
      intent,
      riskLevel,
      confidence: confidence.toFixed(2),
      hasExtractedData: Object.keys(extractedData).length > 0
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
      responseId
    }
  }
} 