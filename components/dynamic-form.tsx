"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormSection, FormQuestion, loadFormSection, getFormFieldValue, setFormFieldValue } from "@/lib/form-data"

interface DynamicFormProps {
  sectionName: string
  formData: Record<string, any>
  isEditable?: boolean
  onUpdate?: (field: string, value: string) => void
}

export function DynamicForm({ sectionName, formData, isEditable = false, onUpdate }: DynamicFormProps) {
  const [isContentVisible, setIsContentVisible] = useState(true)
  const [formSection, setFormSection] = useState<FormSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true)
        const section = await loadFormSection(sectionName)
        setFormSection(section)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [sectionName])

  const handleFieldChange = (question: FormQuestion, value: string) => {
    if (onUpdate) {
      onUpdate(question.id, value)
    }
  }

  const renderField = (question: FormQuestion) => {
    const value = getFormFieldValue(formData, question)
    
    if (question.use === false) {
      return null // Skip this field
    }

    switch (question.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={question.type}
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
            placeholder="Not provided yet..."
            disabled={!isEditable}
          />
        )

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
            disabled={!isEditable}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'date-triple':
        if (!question.parts) return null
        
        return (
          <div className="flex gap-2">
            {question.parts.map((part) => (
              <input
                key={part.sub_id}
                type="text"
                value={formData[part.sub_id] || ''}
                onChange={(e) => {
                  const newFormData = setFormFieldValue(formData, question, '')
                  newFormData[part.sub_id] = e.target.value
                  if (onUpdate) {
                    onUpdate(part.sub_id, e.target.value)
                  }
                }}
                placeholder={part.placeholder}
                className="flex-1 p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
                disabled={!isEditable}
              />
            ))}
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
            placeholder="Not provided yet..."
            disabled={!isEditable}
          />
        )
    }
  }

  const renderReadOnlyField = (question: FormQuestion) => {
    const value = getFormFieldValue(formData, question)
    
    if (question.use === false) {
      return null
    }

    return (
      <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200 min-h-[48px] flex items-center">
        <span className={`text-slate-700 ${!value ? "italic text-slate-500" : ""}`}>
          {value || "Not provided yet..."}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 max-w-2xl w-full h-full flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-light text-slate-700">Loading form...</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 max-w-2xl w-full h-full flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-light text-slate-700">Error</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    )
  }

  if (!formSection) {
    return null
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 max-w-2xl w-full h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-light text-slate-700">{formSection.section}</h3>
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

          {formSection.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {isEditable ? renderField(question) : renderReadOnlyField(question)}
              {question.comment && (
                <p className="text-xs text-slate-500 italic">{question.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 