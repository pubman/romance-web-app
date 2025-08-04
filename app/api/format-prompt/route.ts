import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, projectId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get DeepWriter API configuration from environment variables
    const apiUrl = process.env.DEEPWRITER_API_URL;
    const apiKey = process.env.DEEPWRITER_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'DeepWriter API configuration missing' },
        { status: 500 }
      );
    }

    // Call DeepWriter formatPrompt API
    const response = await fetch(`${apiUrl}/formatPrompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        projectId: projectId || '123e4567-e89b-12d3-a456-426614174000',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to format prompt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      formattedPrompt: data.formattedPrompt || data.prompt || prompt,
      success: true,
    });

  } catch (error) {
    console.error('Format prompt API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}