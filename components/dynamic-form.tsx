"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Plus, Minus, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormSection, FormQuestion, loadFormSection, getFormFieldValue, setFormFieldValue, shouldShowField, getRepeatableGroupData } from "@/lib/form-data"

interface DynamicFormProps {
  sectionName: string
  formData: Record<string, any>
  isEditable?: boolean
  onUpdate?: (field: string, value: string) => void
  showNavigation?: boolean
  onNext?: () => void
  onPrevious?: () => void
  isFirstSection?: boolean
  isLastSection?: boolean
}

export function DynamicForm({ 
  sectionName, 
  formData, 
  isEditable = false, 
  onUpdate,
  showNavigation = false,
  onNext,
  onPrevious,
  isFirstSection = false,
  isLastSection = false
}: DynamicFormProps) {
  const [isContentVisible, setIsContentVisible] = useState(true)
  const [formSection, setFormSection] = useState<FormSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repeatableGroups, setRepeatableGroups] = useState<Record<string, number>>({})

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true)
        const section = await loadFormSection(sectionName)
        setFormSection(section)
        
        // Initialize repeatable groups
        const groups: Record<string, number> = {}
        section.questions.forEach(question => {
          if (question.type === 'repeatable_group') {
            groups[question.id] = Math.max(question.min || 1, getRepeatableGroupData(formData, question.id))
          }
        })
        setRepeatableGroups(groups)
        
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [sectionName, formData])

  const handleFieldChange = (question: FormQuestion, value: string, index?: number) => {
    if (onUpdate) {
      const fieldId = index !== undefined ? `${question.id}_${index}` : question.id
      onUpdate(fieldId, value)
    }
  }

  const handleRepeatableGroupChange = (groupId: string, question: FormQuestion, value: string, index: number) => {
    if (onUpdate) {
      const fieldId = `${question.id}_${index}`
      onUpdate(fieldId, value)
    }
  }

  const addRepeatableGroup = (groupId: string, max: number) => {
    if (repeatableGroups[groupId] < max) {
      setRepeatableGroups(prev => ({ ...prev, [groupId]: prev[groupId] + 1 }))
    }
  }

  const removeRepeatableGroup = (groupId: string, min: number) => {
    if (repeatableGroups[groupId] > min) {
      setRepeatableGroups(prev => ({ ...prev, [groupId]: prev[groupId] - 1 }))
    }
  }

  const renderField = (question: FormQuestion, index?: number) => {
    const value = getFormFieldValue(formData, question, index)
    
    if (question.use === false) {
      return null
    }

    switch (question.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={question.type}
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value, index)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
            placeholder="Not provided yet..."
            disabled={!isEditable}
          />
        )

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value, index)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
            disabled={!isEditable}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value
              const optionLabel = typeof option === 'string' ? option : option.label
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              )
            })}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value
              const optionLabel = typeof option === 'string' ? option : option.label
              return (
                <label key={optionValue} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={index !== undefined ? `${question.id}_${index}` : question.id}
                    value={optionValue}
                    checked={value === optionValue}
                    onChange={(e) => handleFieldChange(question, e.target.value, index)}
                    disabled={!isEditable}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">{optionLabel}</span>
                </label>
              )
            })}
          </div>
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value, index)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700 min-h-[80px] resize-none"
            placeholder="Not provided yet..."
            disabled={!isEditable}
          />
        )

      case 'date-triple':
        if (!question.parts) return null
        
        return (
          <div className="flex gap-2">
            {question.parts.map((part) => (
              <input
                key={part.sub_id}
                type="text"
                value={formData[index !== undefined ? `${part.sub_id}_${index}` : part.sub_id] || ''}
                onChange={(e) => {
                  const newFormData = setFormFieldValue(formData, question, '', index)
                  const partId = index !== undefined ? `${part.sub_id}_${index}` : part.sub_id
                  newFormData[partId] = e.target.value
                  if (onUpdate) {
                    onUpdate(partId, e.target.value)
                  }
                }}
                placeholder={part.placeholder}
                className="flex-1 p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
                disabled={!isEditable}
              />
            ))}
          </div>
        )

      case 'time-pair':
        if (!question.parts) return null
        
        return (
          <div className="flex gap-2">
            {question.parts.map((part) => (
              <input
                key={part.sub_id}
                type="text"
                value={formData[index !== undefined ? `${part.sub_id}_${index}` : part.sub_id] || ''}
                onChange={(e) => {
                  const newFormData = setFormFieldValue(formData, question, '', index)
                  const partId = index !== undefined ? `${part.sub_id}_${index}` : part.sub_id
                  newFormData[partId] = e.target.value
                  if (onUpdate) {
                    onUpdate(partId, e.target.value)
                  }
                }}
                placeholder={part.placeholder}
                className="flex-1 p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
                disabled={!isEditable}
              />
            ))}
          </div>
        )

      case 'display':
        return (
          <div className="p-3 bg-slate-100/50 rounded-lg border border-slate-200 min-h-[48px] flex items-center">
            <span className="text-slate-600 italic">Display field - read only</span>
          </div>
        )

      case 'repeatable_group':
        if (!question.schema) return null
        
        const groupCount = repeatableGroups[question.id] || question.min || 1
        
        return (
          <div className="space-y-4">
            {Array.from({ length: groupCount }, (_, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-700">
                    {question.label} {groupCount > 1 ? `${i + 1}` : ''}
                  </h4>
                  {isEditable && groupCount > (question.min || 1) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRepeatableGroup(question.id, question.min || 1)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {question.schema!.map((schemaQuestion) => {
                    if (!shouldShowField(schemaQuestion, formData, i)) return null
                    
                    return (
                      <div key={schemaQuestion.id} className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                          {schemaQuestion.label}
                          {schemaQuestion.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {isEditable ? renderField(schemaQuestion, i) : renderReadOnlyField(schemaQuestion, i)}
                        {schemaQuestion.comment && (
                          <p className="text-xs text-slate-500 italic">{schemaQuestion.comment}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {isEditable && groupCount < (question.max || 10) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => addRepeatableGroup(question.id, question.max || 10)}
                className="w-full border-dashed border-slate-300 text-slate-600 hover:text-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {question.add_button_label || 'Add another'}
              </Button>
            )}
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(question, e.target.value, index)}
            className="w-full p-3 bg-white/70 border border-slate-300 rounded-lg focus:border-blue-300 focus:ring-blue-200 text-slate-700"
            placeholder="Not provided yet..."
            disabled={!isEditable}
          />
        )
    }
  }

  const renderReadOnlyField = (question: FormQuestion, index?: number) => {
    const value = getFormFieldValue(formData, question, index)
    
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

          {formSection.questions.map((question) => {
            if (!shouldShowField(question, formData)) return null
            
            return (
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
            )
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      {showNavigation && isEditable && (
        <div className="p-4 border-t border-slate-200 flex justify-between">
          <Button
            onClick={onPrevious}
            variant="outline"
            disabled={isFirstSection}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button
            onClick={onNext}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          >
            {isLastSection ? 'Review All' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 