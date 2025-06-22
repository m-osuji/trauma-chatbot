export interface ConversationState {
  progress: {
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
  currentStage: 'introduction' | 'personal_info' | 'incident_details' | 'evidence' | 'witnesses' | 'suspect' | 'contact'
  extractedData: Record<string, any>
  lastQuestion: string
  questionHistory: string[]
  complexTraumaDetected: boolean // Track if complex trauma patterns were detected
}

export class ConversationStateManager {
  private static instance: ConversationStateManager
  private state: ConversationState

  private constructor() {
    this.state = {
      progress: {
        hasName: false,
        hasAge: false,
        hasTiming: false,
        hasLocation: false,
        hasNarrative: false,
        hasDisability: false,
        hasContact: false,
        hasSuspect: false,
        hasWitnesses: false,
        hasEvidence: false
      },
      currentStage: 'introduction',
      extractedData: {},
      lastQuestion: '',
      questionHistory: [],
      complexTraumaDetected: false
    }
  }

  static getInstance(): ConversationStateManager {
    if (!ConversationStateManager.instance) {
      ConversationStateManager.instance = new ConversationStateManager()
    }
    return ConversationStateManager.instance
  }

  // Update state with new extracted data
  updateState(extractedData: Record<string, any>): void {
    this.state.extractedData = { ...this.state.extractedData, ...extractedData }
    
    // Update progress based on extracted data
    if (extractedData.first_name) this.state.progress.hasName = true
    if (extractedData.age) this.state.progress.hasAge = true
    if (extractedData.start_day || extractedData.start_month || extractedData.start_year) this.state.progress.hasTiming = true
    if (extractedData.town_city) this.state.progress.hasLocation = true
    if (extractedData.incident_narrative) this.state.progress.hasNarrative = true
    if (extractedData.disability) this.state.progress.hasDisability = true
    if (extractedData.email || extractedData.phone_number) this.state.progress.hasContact = true
    if (extractedData.suspect_known_0) this.state.progress.hasSuspect = true
    if (extractedData.has_witnesses) this.state.progress.hasWitnesses = true
    if (extractedData.have_personal_media) this.state.progress.hasEvidence = true

    // Check for complex trauma patterns
    const text = JSON.stringify(extractedData).toLowerCase()
    if (text.match(/trapped|wouldn't let|couldn't leave|helpless|powerless|followed|stalking|watching|threatened|said they would/i)) {
      this.state.complexTraumaDetected = true
    }

    // Update current stage
    this.updateStage()
  }

  // Determine the next stage based on progress
  private updateStage(): void {
    if (!this.state.progress.hasName || !this.state.progress.hasAge) {
      this.state.currentStage = 'personal_info'
    } else if (!this.state.progress.hasTiming || !this.state.progress.hasLocation || !this.state.progress.hasNarrative) {
      this.state.currentStage = 'incident_details'
    } else if (!this.state.progress.hasEvidence) {
      this.state.currentStage = 'evidence'
    } else if (!this.state.progress.hasWitnesses) {
      this.state.currentStage = 'witnesses'
    } else if (!this.state.progress.hasSuspect) {
      this.state.currentStage = 'suspect'
    } else if (!this.state.progress.hasContact) {
      this.state.currentStage = 'contact'
    }
  }

  // Get the next question to ask
  getNextQuestion(): { question: string; stage: string } {
    const name = this.state.extractedData.first_name || 'there'

    // Personal info stage
    if (this.state.currentStage === 'personal_info') {
      if (!this.state.progress.hasName) {
        return { question: "Can you tell me your name? What would you like me to call you?", stage: 'personal_info' }
      }
      if (!this.state.progress.hasAge) {
        return { question: `Thank you ${name}. How old are you? This helps us provide appropriate support.`, stage: 'personal_info' }
      }
    }

    // Incident details stage
    if (this.state.currentStage === 'incident_details') {
      if (!this.state.progress.hasTiming) {
        return { question: "When did this happen? You can say things like 'yesterday', 'last week', 'this morning', or give me a specific date and time.", stage: 'incident_details' }
      }
      if (!this.state.progress.hasLocation) {
        return { question: "Where did this happen? Can you tell me the location or area?", stage: 'incident_details' }
      }
      if (!this.state.progress.hasNarrative) {
        return { question: "Can you tell me what happened? What did this person do or say?", stage: 'incident_details' }
      }
    }

    // Evidence stage
    if (this.state.currentStage === 'evidence') {
      if (!this.state.progress.hasEvidence) {
        return { question: "Do you have any photos, videos, or other evidence from the incident?", stage: 'evidence' }
      }
    }

    // Witnesses stage
    if (this.state.currentStage === 'witnesses') {
      if (!this.state.progress.hasWitnesses) {
        return { question: "Were there any witnesses to what happened?", stage: 'witnesses' }
      }
    }

    // Suspect stage
    if (this.state.currentStage === 'suspect') {
      if (!this.state.progress.hasSuspect) {
        return { question: "Can you tell me about the person who did this? What did they look like?", stage: 'suspect' }
      }
    }

    // Contact stage
    if (this.state.currentStage === 'contact') {
      if (!this.state.progress.hasContact) {
        return { question: "How would you prefer to be contacted about next steps? Email or phone?", stage: 'contact' }
      }
    }

    // If everything is complete
    return { question: "Thank you for sharing all of this information. Is there anything else you'd like to add?", stage: 'complete' }
  }

  // Check if we've asked this question recently
  hasAskedRecently(question: string): boolean {
    return this.state.questionHistory.includes(question)
  }

  // Record that we asked a question
  recordQuestion(question: string): void {
    this.state.lastQuestion = question
    this.state.questionHistory.push(question)
    // Keep only last 5 questions to prevent memory bloat
    if (this.state.questionHistory.length > 5) {
      this.state.questionHistory.shift()
    }
  }

  // Get current state
  getState(): ConversationState {
    return { ...this.state }
  }

  // Reset state (for new conversation)
  reset(): void {
    this.state = {
      progress: {
        hasName: false,
        hasAge: false,
        hasTiming: false,
        hasLocation: false,
        hasNarrative: false,
        hasDisability: false,
        hasContact: false,
        hasSuspect: false,
        hasWitnesses: false,
        hasEvidence: false
      },
      currentStage: 'introduction',
      extractedData: {},
      lastQuestion: '',
      questionHistory: [],
      complexTraumaDetected: false
    }
  }
} 