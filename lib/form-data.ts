export interface FormQuestion {
  id: string
  label: string
  type: string
  required: boolean
  options?: string[] | Array<{ value: string; label: string }>
  depends_on?: {
    id: string
    value: string | string[]
  }
  parts?: Array<{ sub_id: string; placeholder: string }>
  use?: boolean
  comment?: string
  // Repeatable group properties
  min?: number
  max?: number
  add_button_label?: string
  schema?: FormQuestion[]
}

export interface FormSection {
  section: string
  defaults?: Record<string, any>
  questions: FormQuestion[]
}

export async function loadFormSection(sectionName: string): Promise<FormSection> {
  try {
    const response = await fetch(`/api/forms/${sectionName}`)
    if (!response.ok) {
      throw new Error(`Failed to load form section: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading form section:', error)
    throw error
  }
}

export function getFormFieldValue(formData: Record<string, any>, question: FormQuestion, index?: number): string {
  const fieldId = index !== undefined ? `${question.id}_${index}` : question.id
  
  if (question.type === 'date-triple' && question.parts) {
    const values = question.parts.map(part => {
      const partId = index !== undefined ? `${part.sub_id}_${index}` : part.sub_id
      return formData[partId] || ''
    }).filter(Boolean)
    return values.length > 0 ? values.join('/') : ''
  }
  
  if (question.type === 'time-pair' && question.parts) {
    const values = question.parts.map(part => {
      const partId = index !== undefined ? `${part.sub_id}_${index}` : part.sub_id
      return formData[partId] || ''
    }).filter(Boolean)
    return values.length > 0 ? values.join(':') : ''
  }
  
  return formData[fieldId] || ''
}

export function setFormFieldValue(
  formData: Record<string, any>, 
  question: FormQuestion, 
  value: string,
  index?: number
): Record<string, any> {
  const newFormData = { ...formData }
  
  if (question.type === 'date-triple' && question.parts) {
    const parts = value.split('/')
    question.parts.forEach((part, partIndex) => {
      const partId = index !== undefined ? `${part.sub_id}_${index}` : part.sub_id
      newFormData[partId] = parts[partIndex] || ''
    })
  } else if (question.type === 'time-pair' && question.parts) {
    const parts = value.split(':')
    question.parts.forEach((part, partIndex) => {
      const partId = index !== undefined ? `${part.sub_id}_${index}` : part.sub_id
      newFormData[partId] = parts[partIndex] || ''
    })
  } else {
    const fieldId = index !== undefined ? `${question.id}_${index}` : question.id
    newFormData[fieldId] = value
  }
  
  return newFormData
}

export function shouldShowField(question: FormQuestion, formData: Record<string, any>, index?: number): boolean {
  if (!question.depends_on) return true
  
  const { id, value } = question.depends_on
  const fieldId = index !== undefined ? `${id}_${index}` : id
  const fieldValue = formData[fieldId]
  
  if (Array.isArray(value)) {
    return value.includes(fieldValue)
  }
  return fieldValue === value
}

export function getRepeatableGroupData(formData: Record<string, any>, groupId: string): number {
  // Count how many instances of this repeatable group exist
  const keys = Object.keys(formData)
  const groupKeys = keys.filter(key => key.startsWith(`${groupId}_`) && key.match(new RegExp(`^${groupId}_\\d+$`)))
  
  if (groupKeys.length === 0) return 0
  
  // Find the highest index
  const indices = groupKeys.map(key => {
    const match = key.match(new RegExp(`^${groupId}_(\\d+)$`))
    return match ? parseInt(match[1]) : 0
  })
  
  return Math.max(...indices) + 1
} 