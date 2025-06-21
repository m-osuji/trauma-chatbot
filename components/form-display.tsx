"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormData {
  name?: string
  age?: string
  incident_type?: string
  date_occurred?: string
  location?: string
  description?: string
  support_needed?: string
  contact_preference?: string
}

interface FormDisplayProps {
  formData: FormData
  isEditable?: boolean
  onUpdate?: (field: string, value: string) => void
}

export function FormDisplay({ formData, isEditable = false, onUpdate }: FormDisplayProps) {
  const [isContentVisible, setIsContentVisible] = useState(true)

  const fields = [
    { key: "name", label: "Name", type: "text" },
    { key: "age", label: "Age", type: "text" },
    { key: "incident_type", label: "Type of Incident", type: "text" },
    { key: "date_occurred", label: "When it Occurred", type: "text" },
    { key: "location", label: "Location", type: "text" },
    { key: "description", label: "What Happened", type: "textarea" },
    { key: "support_needed", label: "Support Needed", type: "textarea" },
    { key: "contact_preference", label: "How to Contact You", type: "text" },
  ]

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 max-w-2xl w-full h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-light text-slate-700">Your Information</h3>
        <Button
          onClick={() => setIsContentVisible(!isContentVisible)}
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-slate-700 p-2"
          title={isContentVisible ? "Hide contents" : "Show contents"}
        >
          {isContentVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={`space-y-4 transition-all duration-300 ${
            !isContentVisible ? "filter blur-md pointer-events-none select-none" : ""
          }`}
        >
          {!isContentVisible && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/20 backdrop-blur-sm rounded-2xl">
              <p className="text-slate-600 text-center px-4">
                Contents hidden for your comfort.
                <br />
                <span className="text-sm">Click the eye icon to show.</span>
              </p>
            </div>
          )}

          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium text-slate-600">{field.label}</label>
              {isEditable ? (
                field.type === "textarea" ? (
                  <textarea
                    value={formData[field.key as keyof FormData] || ""}
                    onChange={(e) => onUpdate?.(field.key, e.target.value)}
                    className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700 min-h-[80px] resize-none"
                    placeholder="Not provided yet..."
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.key as keyof FormData] || ""}
                    onChange={(e) => onUpdate?.(field.key, e.target.value)}
                    className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
                    placeholder="Not provided yet..."
                  />
                )
              ) : (
                <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200 min-h-[48px] flex items-center">
                  <span
                    className={`text-slate-700 ${!formData[field.key as keyof FormData] ? "italic text-slate-500" : ""}`}
                  >
                    {formData[field.key as keyof FormData] || "Not provided yet..."}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
