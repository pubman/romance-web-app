import { NextRequest, NextResponse } from 'next/server';

// Generate unique request ID for logging
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
  
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { prompt, projectId } = requestBody;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt must be a non-empty string' },
        { status: 400 }
      );
    }

    // Get and validate environment variables
    const apiUrl = process.env.DEEPWRITER_API_URL;
    const apiKey = process.env.DEEPWRITER_API_KEY;
    const nodeEnv = process.env.NODE_ENV;

    if (!apiUrl || !apiKey) {
      console.error(`[${requestId}] Missing environment variables:`, {
        DEEPWRITER_API_URL: !!apiUrl,
        DEEPWRITER_API_KEY: !!apiKey
      });
      
      // In development, provide mock response or detailed error
      if (nodeEnv === 'development') {
        console.log(`[${requestId}] Development mode: providing mock formatted prompt`);
        
        // Return a mock formatted response for development
        const mockFormattedPrompt = `[MOCK FORMATTED]\n\n${prompt}\n\n[This is a mock response for development. Configure DEEPWRITER_API_URL and DEEPWRITER_API_KEY environment variables to use the real API.]`;
        
        return NextResponse.json({
          formattedPrompt: mockFormattedPrompt,
          success: true,
          mock: true,
          requestId,
          warning: 'This is a mock response for development. Configure DeepWriter API credentials for production use.'
        });
      }
      
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      );
    }

    // Prepare request to external API
    const externalApiUrl = `${apiUrl}/api/formatPrompt`;
    const requestPayload = {
      prompt: prompt.trim(),
      projectId: projectId || '123e4567-e89b-12d3-a456-426614174000',
    };

    console.log(`[${requestId}] Calling external API:`, {
      url: externalApiUrl,
      method: 'POST',
      payloadSize: JSON.stringify(requestPayload).length,
      hasApiKey: !!apiKey
    });

    // Call DeepWriter formatPrompt API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      console.error(`[${requestId}] Fetch error:`, {
        name: (fetchError as Error).name,
        message: (fetchError as Error).message,
        stack: (fetchError as Error).stack
      });
      
      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - DeepWriter API did not respond within 30 seconds' },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to connect to DeepWriter API' },
        { status: 503 }
      );
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error(`[${requestId}] External API error response:`, errorData);
      } catch (jsonError) {
        console.error(`[${requestId}] Failed to parse error response:`, jsonError);
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }
      
      return NextResponse.json(
        { 
          error: errorData.message || `External API error: ${response.status}`,
          statusCode: response.status
        },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    // Parse successful response
    let data;
    try {
      data = await response.json();
  
    } catch (jsonError) {
      console.error(`[${requestId}] Failed to parse success response:`, jsonError);
      return NextResponse.json(
        { error: 'Invalid response from DeepWriter API' },
        { status: 502 }
      );
    }
    
    const enhancedPrompt = data.enhanced_prompt || data.prompt || prompt;
    
    return NextResponse.json({
      formattedPrompt: enhancedPrompt,
      success: true,
      requestId // Include for debugging
    });

  } catch (error: unknown) {
    console.error(`[${requestId}] Unexpected error:`, {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        requestId // Include for debugging
      },
      { status: 500 }
    );
  }
}