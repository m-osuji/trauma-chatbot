export interface FormQuestion {
  id: string
  label: string
  type: string
  required: boolean
  options?: string[]
  parts?: Array<{ sub_id: string; placeholder: string }>
  use?: boolean
  comment?: string
}

export interface FormSection {
  section: string
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

export function getFormFieldValue(formData: Record<string, any>, question: FormQuestion): string {
  if (question.type === 'date-triple' && question.parts) {
    const values = question.parts.map(part => formData[part.sub_id] || '').filter(Boolean)
    return values.length > 0 ? values.join('/') : ''
  }
  return formData[question.id] || ''
}

export function setFormFieldValue(
  formData: Record<string, any>, 
  question: FormQuestion, 
  value: string
): Record<string, any> {
  const newFormData = { ...formData }
  
  if (question.type === 'date-triple' && question.parts) {
    const parts = value.split('/')
    question.parts.forEach((part, index) => {
      newFormData[part.sub_id] = parts[index] || ''
    })
  } else {
    newFormData[question.id] = value
  }
  
  return newFormData
} 