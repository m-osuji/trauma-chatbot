"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { VoiceCircle } from "@/components/voice-circle"
import { QuickExit } from "@/components/quick-exit"
import { DynamicForm } from "@/components/dynamic-form"
import { ChevronDown, ChevronUp, Mic, MicOff, Send, Heart, Phone, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react"

type Stage = "landing" | "conversation" | "form" | "review" | "complete"

// Form sections in logical order
const FORM_SECTIONS = [
  "your-details",
  "victim-role", 
  "your-role",
  "incident-details",
  "evidence",
  "witness-details",
  "suspect-details"
]

// Updated to match the JSON structure from all form sections
interface FormData {
  // Personal details (your-details.json)
  title?: string
  first_name?: string
  surname?: string
  email?: string
  dob_day?: string
  dob_month?: string
  dob_year?: string
  sex?: string
  phone_number?: string
  building_name?: string
  building_number?: string
  street?: string
  town_city?: string
  postcode?: string
  
  // Victim role (victim-role.json)
  under18?: string
  guardian_title?: string
  guardian_first_name?: string
  guardian_surname?: string
  guardian_email?: string
  other_crimes12m?: string
  other_crimes_description?: string
  health_issues?: string
  health_issues_details?: string
  victim_support?: string
  disability?: string
  ethnicity?: string
  pre_contact?: string
  alt_action_if_no_website?: string
  pre_contact_other_details?: string
  
  // Your role (your-role.json)
  involvement?: string
  victim_title?: string
  victim_first_name?: string
  victim_surname?: string
  victim_age?: string
  victim_sex?: string
  victim_email?: string
  victim_phone?: string
  victim_address_lookup?: string
  victim_building_name?: string
  victim_building_number?: string
  victim_street?: string
  victim_town_city?: string
  victim_postcode?: string
  victim_description?: string
  victim_connection_explain?: string
  victim_under18?: string
  victim_other_crimes12m?: string
  victim_health_issues?: string
  victim_contact_support?: string
  victim_disability?: string
  victim_ethnicity?: string
  business_name?: string
  business_email?: string
  business_phone?: string
  business_address_lookup?: string
  business_building_name?: string
  business_building_number?: string
  business_street?: string
  business_town_city?: string
  business_postcode?: string
  business_description?: string
  business_connection_explain?: string
  
  // Incident details (incident-details.json)
  already_reported?: string
  reference_number?: string
  start_day?: string
  start_month?: string
  start_year?: string
  end_day?: string
  end_month?: string
  end_year?: string
  start_hour?: string
  start_minute?: string
  end_hour?: string
  end_minute?: string
  approx_time_note?: string
  incident_address_display?: string
  incident_location_detail?: string
  public_transport?: string
  transport_card_details?: string
  incident_narrative?: string
  bias_factor?: string
  bias_factor_explain?: string
  
  // Evidence (evidence.json)
  suspect_left_items?: string
  suspect_items_description?: string
  have_personal_media?: string
  third_party_video?: string
  third_party_contact?: string
  third_party_content?: string
  third_party_appearance?: string
  
  // Witness details (witness-details.json) - repeatable group
  has_witnesses?: string
  // Witness fields will be indexed: wit_title_0, wit_first_name_0, etc.
  
  // Suspect details (suspect-details.json) - repeatable group
  // Suspect fields will be indexed: suspect_known_0, sus_first_name_0, etc.
  
  // Legacy fields for backward compatibility
  name?: string
  age?: string
  incident_type?: string
  date_occurred?: string
  location?: string
  description?: string
  support_needed?: string
  contact_preference?: string
}

export default function TraumaVoiceForm() {
  const [stage, setStage] = useState<Stage>("landing")
  const [showDescription, setShowDescription] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [simulateAudio, setSimulateAudio] = useState(false)
  const [currentFormSection, setCurrentFormSection] = useState(0)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    streamProtocol: "text", // Use text protocol for simple JSON responses
    onFinish: (assistantMessage) => {
      extractFormData(assistantMessage.content)
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Audio level detection
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)

      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      microphoneRef.current.connect(analyserRef.current)

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)

          // Calculate average volume
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const average = sum / bufferLength
          const normalizedLevel = Math.min(average / 128, 1) // Normalize to 0-1

          setAudioLevel(normalizedLevel)
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }

      updateAudioLevel()
      console.log("Audio analysis started successfully")
    } catch (error) {
      console.error("Error accessing microphone:", error)
      // Fallback to simulated audio for demo purposes
      setSimulateAudio(true)
      console.log("Falling back to simulated audio visualization")
    }
  }

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close()
    }
    setAudioLevel(0)
    setSimulateAudio(false)
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          handleInputChange({ target: { value: finalTranscript } } as any)
          // Auto-submit after voice input
          setTimeout(() => {
            const form = document.querySelector("form")
            if (form) {
              form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
            }
          }, 500)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setIsRecording(false)
        stopAudioAnalysis()
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        setIsRecording(false)
        stopAudioAnalysis()
      }
    } else {
      console.log("Speech recognition not supported, using simulated audio for demo")
    }
  }, [handleInputChange])

  const extractFormData = (content: string) => {
    // Enhanced extraction logic for user messages
    const newFormData = { ...formData }

    // Look at the last user message for extraction
    const lastUserMessage =
      messages
        .slice()
        .reverse()
        .find((m) => m.role === "user")?.content || ""

    // Extract name (first name and surname)
    const namePatterns = [
      /my name is ([^.!?]+)/i, 
      /i'm ([^.!?]+)/i, 
      /call me ([^.!?]+)/i,
      /i am ([^.!?]+)/i
    ]
    for (const pattern of namePatterns) {
      const match = lastUserMessage.match(pattern)
      if (match && !newFormData.first_name) {
        const fullName = match[1].trim()
        const nameParts = fullName.split(' ')
        newFormData.first_name = nameParts[0] || ''
        newFormData.surname = nameParts.slice(1).join(' ') || ''
        break
      }
    }

    // Extract email
    const emailMatch = lastUserMessage.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
    if (emailMatch && !newFormData.email) {
      newFormData.email = emailMatch[0]
    }

    // Extract phone number
    const phoneMatch = lastUserMessage.match(/(\+?[\d\s\-\(\)]{10,})/)
    if (phoneMatch && !newFormData.phone_number) {
      newFormData.phone_number = phoneMatch[1].replace(/\s+/g, '')
    }

    // Extract date of birth
    const dobPatterns = [
      /born on (\d{1,2})\/(\d{1,2})\/(\d{4})/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
      /(\d{1,2})-(\d{1,2})-(\d{4})/i
    ]
    for (const pattern of dobPatterns) {
      const match = lastUserMessage.match(pattern)
      if (match && !newFormData.dob_day) {
        newFormData.dob_day = match[1]
        newFormData.dob_month = match[2]
        newFormData.dob_year = match[3]
        break
      }
    }

    // Extract sex/gender
    const sexPatterns = [
      /i am (female|male)/i,
      /i'm (female|male)/i,
      /(female|male)/i
    ]
    for (const pattern of sexPatterns) {
      const match = lastUserMessage.match(pattern)
      if (match && !newFormData.sex) {
        newFormData.sex = match[1].charAt(0).toUpperCase() + match[1].slice(1)
        break
      }
    }

    // Extract address information
    const addressPatterns = [
      /i live in ([^.!?]+)/i,
      /my address is ([^.!?]+)/i,
      /i'm from ([^.!?]+)/i
    ]
    for (const pattern of addressPatterns) {
      const match = lastUserMessage.match(pattern)
      if (match && !newFormData.town_city) {
        newFormData.town_city = match[1].trim()
        break
      }
    }

    // Legacy extraction for backward compatibility
    // Extract age
    const ageMatch = lastUserMessage.match(/i am (\d+)|i'm (\d+)|(\d+) years old/i)
    if (ageMatch && !newFormData.age) {
      newFormData.age = ageMatch[1] || ageMatch[2] || ageMatch[3]
    }

    // Extract incident type
    const incidentPatterns = [
      /it was (assault|harassment|abuse|violence|attack)/i,
      /(assault|harassment|abuse|violence|attack) happened/i,
    ]
    for (const pattern of incidentPatterns) {
      const match = lastUserMessage.match(pattern)
      if (match && !newFormData.incident_type) {
        newFormData.incident_type = match[1] || match[2]
        break
      }
    }

    // Extract date information
    const datePatterns = [
      /last (week|month|year)/i,
      /(\d+) (days?|weeks?|months?|years?) ago/i,
      /(yesterday|today)/i,
      /in (january|february|march|april|may|june|july|august|september|october|november|december)/i,
    ]
    for (const pattern of datePatterns) {
      const match = lastUserMessage.match(pattern)
      if (match && !newFormData.date_occurred) {
        newFormData.date_occurred = match[0]
        break
      }
    }

    setFormData(newFormData)
  }

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true)
      setIsListening(true)
      startAudioAnalysis()
      recognitionRef.current.start()
    } else {
      // Fallback for demo - just enable simulated audio
      setIsRecording(true)
      setIsListening(true)
      setSimulateAudio(true)
      console.log("Using simulated recording for demo")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    setIsListening(false)
    stopAudioAnalysis()
  }

  const handleFormUpdate = (field: string, value: string) => {
    setFormData((prev) => {
      // Handle date-triple fields
      if (field === 'dob_day' || field === 'dob_month' || field === 'dob_year') {
        return { ...prev, [field]: value }
      }
      
      // Handle regular fields
      return { ...prev, [field]: value }
    })
  }

  const nextFormSection = () => {
    if (currentFormSection < FORM_SECTIONS.length - 1) {
      setCurrentFormSection(currentFormSection + 1)
    } else {
      setStage("review")
    }
  }

  const previousFormSection = () => {
    if (currentFormSection > 0) {
      setCurrentFormSection(currentFormSection - 1)
    } else {
      setStage("conversation")
    }
  }

  const goToFormSection = (index: number) => {
    setCurrentFormSection(index)
  }

  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <QuickExit />
      <div className="text-center max-w-2xl">
        <VoiceCircle isActive={false} size="lg" />

        <h1 className="text-3xl font-light text-slate-700 mt-8 mb-4">We're here to listen</h1>

        <p className="text-slate-600 mb-8 leading-relaxed">
          This is a safe space where you can share your experience at your own pace. Your voice matters, and we're here
          to support you.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => setStage("conversation")}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-light"
          >
            Tell me about it
          </Button>

          <Button
            onClick={() => setShowDescription(!showDescription)}
            variant="ghost"
            className="text-slate-600 hover:text-slate-700 flex items-center gap-2"
          >
            {showDescription ? "Hide" : "Show"} more information
            {showDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {showDescription && (
          <Card className="mt-6 p-6 bg-white/60 backdrop-blur-sm border-slate-200 text-left">
            <h3 className="font-medium text-slate-700 mb-3">How this works</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• You can speak or type to share your experience</li>
              <li>• We'll gently ask questions to understand what happened</li>
              <li>• You can stop or take breaks anytime you need</li>
              <li>• Your information helps us connect you with the right support</li>
              <li>• Everything is confidential and secure</li>
              <li>• All data stays within our secure system - no external services</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  )

  const renderConversation = () => (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <QuickExit />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          <div className="text-center mb-6 flex-shrink-0">
            <VoiceCircle
              isActive={isRecording || isLoading}
              audioLevel={audioLevel}
              size="md"
              simulateAudio={simulateAudio}
            />
            <p className="text-slate-600 mt-4">
              {isRecording ? "Listening..." : isLoading ? "Understanding..." : "Tap to speak or type below"}
            </p>
            {simulateAudio && <p className="text-xs text-slate-500 mt-1">Demo mode - simulated audio visualization</p>}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <Card className="bg-white/70 border-slate-200 backdrop-blur-sm p-4 max-w-[80%]">
                  <p className="text-slate-700 leading-relaxed">
                    Hi there. I'm here to listen and help you share what happened. We can go as slowly as you need.
                    Would you like to start by telling me your name?
                  </p>
                </Card>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user" ? "bg-blue-100/70 border-blue-200" : "bg-white/70 border-slate-200"
                  } backdrop-blur-sm`}
                >
                  <div className="text-slate-700 leading-relaxed">{message.content}</div>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-white/70 border-slate-200 backdrop-blur-sm p-4 max-w-[80%]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm">Listening thoughtfully...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your response here..."
                className="flex-1 p-3 bg-white/70 border border-slate-300 rounded-xl focus:border-blue-300 focus:ring-blue-200 text-slate-700"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="lg"
                className="rounded-xl"
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>

            <div className="text-center">
              <Button onClick={() => setStage("form")} variant="outline" className="text-slate-600 border-slate-300">
                I'm ready to fill out the form
              </Button>
            </div>
          </div>
        </div>

        {/* Live Form Section */}
        <div className="w-96 flex-shrink-0 p-4 border-l border-slate-200 bg-white/30 backdrop-blur-sm flex flex-col">
          {/* Form Section Navigation */}
          <div className="mb-4">
            <div className="text-sm font-medium text-slate-700 mb-2">
              {FORM_SECTIONS[currentFormSection].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="flex items-center justify-between mb-2">
              <Button
                onClick={previousFormSection}
                variant="ghost"
                size="sm"
                disabled={currentFormSection === 0}
                className="text-xs"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Previous
              </Button>
              
              <div className="text-xs text-slate-600">
                {currentFormSection + 1} of {FORM_SECTIONS.length}
              </div>
              
              <Button
                onClick={nextFormSection}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Next
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Section Progress */}
            <div className="flex gap-1">
              {FORM_SECTIONS.map((section, index) => (
                <button
                  key={section}
                  onClick={() => goToFormSection(index)}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    index === currentFormSection
                      ? 'bg-blue-500'
                      : index < currentFormSection
                      ? 'bg-blue-300'
                      : 'bg-slate-200'
                  }`}
                  title={`Go to ${section.replace('-', ' ')}`}
                />
              ))}
            </div>
          </div>

          <DynamicForm sectionName={FORM_SECTIONS[currentFormSection]} formData={formData} />
        </div>
      </div>
    </div>
  )

  const renderForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <QuickExit />

      <div className="max-w-4xl w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <VoiceCircle isActive={false} size="md" />
          <h2 className="text-2xl font-light text-slate-700 mt-6 mb-4">Complete Your Report</h2>
          <p className="text-slate-600">
            Please fill out each section of the form. You can navigate between sections using the buttons below.
          </p>
        </div>

        {/* Form Section Navigation */}
        <div className="w-full max-w-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={previousFormSection}
              variant="outline"
              disabled={currentFormSection === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="text-sm text-slate-600">
              Section {currentFormSection + 1} of {FORM_SECTIONS.length}
            </div>
            
            <Button
              onClick={nextFormSection}
              variant="outline"
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Section Progress */}
          <div className="flex gap-1 mb-4">
            {FORM_SECTIONS.map((section, index) => (
              <button
                key={section}
                onClick={() => goToFormSection(index)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index === currentFormSection
                    ? 'bg-blue-500'
                    : index < currentFormSection
                    ? 'bg-blue-300'
                    : 'bg-slate-200'
                }`}
                title={`Go to ${section.replace('-', ' ')}`}
              />
            ))}
          </div>
        </div>

        {/* Current Form Section */}
        <div className="w-full flex justify-center mb-8">
          <DynamicForm 
            sectionName={FORM_SECTIONS[currentFormSection]} 
            formData={formData} 
            isEditable={true} 
            onUpdate={handleFormUpdate}
            showNavigation={true}
            onNext={nextFormSection}
            onPrevious={previousFormSection}
            isFirstSection={currentFormSection === 0}
            isLastSection={currentFormSection === FORM_SECTIONS.length - 1}
          />
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setStage("conversation")}
            variant="outline"
            className="px-6 py-3 border-slate-300 text-slate-600"
          >
            Back to Conversation
          </Button>
          <Button 
            onClick={() => setStage("review")} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3"
          >
            Review All Information
          </Button>
        </div>
      </div>
    </div>
  )

  const renderReview = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <QuickExit />

      <div className="max-w-6xl w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <VoiceCircle isActive={false} size="md" />
          <h2 className="text-2xl font-light text-slate-700 mt-6 mb-4">Review Your Information</h2>
          <p className="text-slate-600">
            Please review all the information we've collected. You can edit anything that doesn't look right.
          </p>
        </div>

        {/* All Form Sections */}
        <div className="w-full max-h-[70vh] overflow-y-auto space-y-6 mb-8">
          {FORM_SECTIONS.map((sectionName, index) => (
            <div key={sectionName} className="w-full">
              <DynamicForm 
                sectionName={sectionName} 
                formData={formData} 
                isEditable={true} 
                onUpdate={handleFormUpdate}
                showNavigation={false}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setStage("form")}
            variant="outline"
            className="px-6 py-3 border-slate-300 text-slate-600"
          >
            Back to Form
          </Button>
          <Button onClick={() => setStage("complete")} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3">
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <QuickExit />

      <div className="max-w-2xl text-center">
        <VoiceCircle isActive={false} size="lg" />

        <h2 className="text-3xl font-light text-slate-700 mt-8 mb-4">Thank you for sharing</h2>

        <p className="text-slate-600 mb-8 leading-relaxed">
          Your courage in speaking up matters. We've received your information and someone will be in touch according to
          your preferences. You're not alone in this.
        </p>

        <Card className="bg-white/60 backdrop-blur-sm border-slate-200 p-6 text-left mb-8">
          <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            Immediate Support Resources
          </h3>
          <div className="space-y-3">
            <a
              href="tel:988"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-slate-700">Crisis Lifeline</div>
                <div className="text-sm text-slate-600">Call or text 988 - Available 24/7</div>
              </div>
            </a>

            <a
              href="https://www.rainn.org/get-help"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-slate-700">RAINN National Hotline</div>
                <div className="text-sm text-slate-600">1-800-656-HOPE (4673)</div>
              </div>
            </a>

            <a
              href="https://www.thehotline.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-slate-700">National Domestic Violence Hotline</div>
                <div className="text-sm text-slate-600">1-800-799-7233</div>
              </div>
            </a>
          </div>
        </Card>

        <p className="text-sm text-slate-500">
          Your information has been securely submitted. Please keep these resources handy.
        </p>
      </div>
    </div>
  )

  switch (stage) {
    case "landing":
      return renderLandingPage()
    case "conversation":
      return renderConversation()
    case "form":
      return renderForm()
    case "review":
      return renderReview()
    case "complete":
      return renderComplete()
    default:
      return renderLandingPage()
  }
}
