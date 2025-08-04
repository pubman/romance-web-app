import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Make request to DeepWriter API with the specified format
    const deepwriterUrl = process.env.DEEPWRITER_API_URL || 'https://app.deepwriter.com';
    const apiKey = process.env.DEEPWRITER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepWriter API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${deepwriterUrl}/api/getJobStatus?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "*/*"
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepWriter API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      return NextResponse.json(
        { error: 'Failed to fetch job status from DeepWriter' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('getJobStatus error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}