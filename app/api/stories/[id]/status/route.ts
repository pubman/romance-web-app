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
    const { id: storyId } = await params;

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
        },
        job: null,
      });
    }

    // If no job ID, story is in draft state
    if (!story.generation_job_id) {
      return NextResponse.json({
        story: {
          id: story.id,
          title: story.title,
          status: 'failed',
          progress: 0,
        },
        job: null,
      });
    }

    try {
      // Check job status with DeepWriter
      const deepwriterService = createDeepwriterService();
      const job = await deepwriterService.checkJobStatus(story.generation_job_id);

      // Update story progress in database
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

      // If job is completed, fetch and store content
      if (job.status === 'completed' && newStatus === 'completed') {
        try {
          const content = await deepwriterService.getJobContent(story.generation_job_id);
          
          // Store content (this could be in a separate table or as JSONB)
          await supabase
            .from('stories')
            .update({
              word_count: content.content.metadata.word_count,
              chapter_count: content.content.metadata.chapter_count,
              // Store content URL or the content itself
              content_url: `/api/stories/${storyId}/content`,
            })
            .eq('id', storyId);

          // You might want to store the actual content in a separate table
          // or file system depending on your architecture
        } catch (contentError) {
          console.error('Failed to fetch job content:', contentError);
        }
      }

      return NextResponse.json({
        story: {
          id: story.id,
          title: story.title,
          status: newStatus,
          progress: job.progress,
        },
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          message: job.message,
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
        },
        job: {
          id: story.generation_job_id,
          status: 'unknown',
          progress: story.generation_progress,
          message: 'Unable to check status',
        },
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