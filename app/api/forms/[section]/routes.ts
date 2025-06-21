 
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Type definitions for form structure
interface FormQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  depends_on?: {
    id: string;
    value: string | string[];
  };
  parts?: Array<{
    sub_id: string;
    placeholder: string;
  }>;
  use?: boolean;
  comment?: string;
}

interface FormDefinition {
  section: string;
  questions: FormQuestion[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { section: string } }
) {
  try {
    const { section } = params;
    
    // Validate section parameter
    if (!section || typeof section !== 'string') {
      return NextResponse.json(
        { error: 'Invalid section parameter' },
        { status: 400 }
      );
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), 'data', 'forms', `${section}.json`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: `Form section '${section}' not found` },
        { status: 404 }
      );
    }

    // Read and parse the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const formData: FormDefinition = JSON.parse(fileContent);

    // Validate the form structure
    if (!formData.section || !Array.isArray(formData.questions)) {
      return NextResponse.json(
        { error: 'Invalid form structure' },
        { status: 500 }
      );
    }

    return NextResponse.json(formData);

  } catch (error) {
    console.error('Error loading form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add POST method for form validation
export async function POST(
  request: NextRequest,
  { params }: { params: { section: string } }
) {
  try {
    const { section } = params;
    const body = await request.json();

    // Basic validation - you can expand this
    const formData = await GET(request, { params });
    const formDefinition = await formData.json();

    // Validate required fields
    const errors: string[] = [];
    
    formDefinition.questions.forEach((question: FormQuestion) => {
      if (question.required && !body[question.id]) {
        errors.push(`${question.label} is required`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Form data for ${section} is valid` 
    });

  } catch (error) {
    console.error('Error validating form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}