import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: storyId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get story with job ID
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, status, generation_job_id, generation_progress, title')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // If story is already completed or failed, return current status
    if (story.status === 'completed' || story.status === 'failed') {
      return NextResponse.json({
        story: {
          id: story.id,
          title: story.title,
          status: story.status,
          progress: story.generation_progress,
          progress_stage: story.status,
          percent_complete: story.status === 'completed' ? 1 : (story.generation_progress || 0) / 100,
          error_message: story.status === 'failed' ? 'Story generation failed' : null,
        },
        job: story.generation_job_id ? {
          id: story.generation_job_id,
          status: story.status,
          progress: story.generation_progress,
          progress_stage: story.status,
          message: story.status === 'completed' ? 'Story completed' : 'Story failed',
          models: {
            reasoning: 'google/gemini-2.5-flash-001',
            writing: 'google/gemini-2.5-flash-001',
            function: 'google/gemini-2.5-flash-001',
          },
          is_byok: false,
          is_starred: false,
        } : null,
      });
    }

    // Use provided jobId or fall back to story's generation_job_id
    const effectiveJobId = jobId || story.generation_job_id;

    // If no job ID available, story is in draft state
    if (!effectiveJobId) {
      return NextResponse.json({
        story: {
          id: story.id,
          title: story.title,
          status: 'failed',
          progress: 0,
          progress_stage: 'failed',
          percent_complete: 0,
          error_message: 'No job ID available'
        },
        job: null,
      });
    }

    // Get DeepWriter API configuration
    const deepwriterUrl = process.env.DEEPWRITER_API_URL || 'https://app.deepwriter.com';
    const apiKey = process.env.DEEPWRITER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepWriter API key not configured' },
        { status: 500 }
      );
    }

    try {
      // Check job status with DeepWriter using direct API call
      const response = await fetch(`${deepwriterUrl}/api/getJobStatus?jobId=${effectiveJobId}`, {
        method: 'GET',
        headers: {
          "x-api-key": apiKey,
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
        throw new Error('Failed to fetch job status from DeepWriter');
      }

      const job = await response.json();

      // Map DeepWriter job status to our story status  
      let newStatus = story.status;
      const apiStatusToInternal = (apiStatus: string) => {
        const statusMap: { [key: string]: string } = {
          'draft': 'draft',
          'processing': 'generating', 
          'completed': 'completed',
          'failed': 'failed'
        };
        return statusMap[apiStatus] || 'generating';
      };

      newStatus = apiStatusToInternal(job.status);
      const newProgress = job.progress || 0;

      // Update story in database if status or progress changed
      if (newStatus !== story.status || newProgress !== story.generation_progress) {
        await supabase
          .from('stories')
          .update({
            status: newStatus,
            generation_progress: newProgress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storyId);
      }

      // Return response in expected format
      return NextResponse.json({
        story: {
          id: story.id,
          title: story.title || job.title,
          status: newStatus,
          progress: newProgress,
          progress_stage: job.progress_stage || 'generating_work',
          percent_complete: job.percent_complete || (newProgress / 100),
          error_message: job.error_message || null,
        },
        job: {
          id: job.id,
          status: job.status,
          progress: newProgress,
          progress_stage: job.progress_stage || 'generating_work',
          message: job.message,
          models: {
            reasoning: job.reasoning_model || 'google/gemini-2.5-flash-001',
            writing: job.writing_model || 'google/gemini-2.5-flash-001', 
            function: job.function_model || 'google/gemini-2.5-flash-001',
          },
          is_byok: job.is_byok || false,
          is_starred: job.is_starred || false,
        },
      });

    } catch (deepwriterError) {
      console.error('DeepWriter status check error:', deepwriterError);
      
      // If DeepWriter API is down, return cached status
      return NextResponse.json({
        story: {
          id: story.id,
          title: story.title,
          status: story.status,
          progress: story.generation_progress,
          progress_stage: 'unknown',
          percent_complete: (story.generation_progress || 0) / 100,
          error_message: 'Unable to check status',
        },
        job: effectiveJobId ? {
          id: effectiveJobId,
          status: 'unknown',
          progress: story.generation_progress,
          progress_stage: 'unknown',
          message: 'Unable to check status',
          models: {
            reasoning: 'google/gemini-2.5-flash-001',
            writing: 'google/gemini-2.5-flash-001',
            function: 'google/gemini-2.5-flash-001',
          },
          is_byok: false,
          is_starred: false,
        } : null,
      });
    }

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}