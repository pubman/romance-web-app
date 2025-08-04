import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';

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
    const { id: storyId } = params;

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

    // If no generation job, PDF is not available
    if (!story.generation_job_id) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'This story does not have PDF generation capability',
        pdfUrl: null,
      });
    }

    // If story is already completed, PDF should be ready
    if (story.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        message: 'PDF is ready for viewing',
        pdfUrl: `/api/stories/${storyId}/preview-pdf`,
        progress: 100,
      });
    }

    // If story failed, PDF is not available
    if (story.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        message: 'PDF generation failed',
        pdfUrl: null,
        error: 'Story generation failed',
      });
    }

    try {
      // Check current job status with DeepWriter
      const deepwriterService = createDeepwriterService();
      const job = await deepwriterService.checkJobStatus(story.generation_job_id);

      // Update story status if it changed
      let newStatus = story.status;
      if (job.status === 'completed') {
        newStatus = 'completed';
      } else if (job.status === 'failed') {
        newStatus = 'failed';
      }

      if (newStatus !== story.status || job.progress !== story.generation_progress) {
        await supabase
          .from('stories')
          .update({
            status: newStatus,
            generation_progress: job.progress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storyId);
      }

      // Return updated status
      return NextResponse.json({
        status: job.status,
        message: job.message || 'Checking PDF generation status',
        pdfUrl: job.status === 'completed' ? `/api/stories/${storyId}/preview-pdf` : null,
        progress: job.progress,
        error: job.status === 'failed' ? (job.message || 'Generation failed') : null,
      });

    } catch (deepwriterError) {
      console.error('DeepWriter status check error:', deepwriterError);
      
      // Return cached status if service is unavailable
      return NextResponse.json({
        status: story.status,
        message: 'Unable to check current status - service unavailable',
        pdfUrl: story.status === 'completed' ? `/api/stories/${storyId}/preview-pdf` : null,
        progress: story.generation_progress,
        error: 'Status check unavailable',
      });
    }

  } catch (error) {
    console.error('PDF status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}