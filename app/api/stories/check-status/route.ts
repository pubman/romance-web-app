import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';

interface CheckStatusRequest {
  storyIds: string[];
}

interface StoryStatusUpdate {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  generation_progress: number;
  error_message?: string;
  updated_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckStatusRequest = await request.json();
    const { storyIds } = body;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return NextResponse.json(
        { error: 'Story IDs array is required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent excessive API calls
    if (storyIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 stories can be checked at once' },
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

    // Fetch stories with their job IDs - only user's stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, status, generation_job_id, generation_progress')
      .eq('user_id', user.id)
      .in('id', storyIds)
      .eq('status', 'generating'); // Only check generating stories

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({
        success: true,
        updates: [],
        message: 'No generating stories found'
      });
    }

    // Initialize DeepWriter service with error handling
    let deepwriterService;
    try {
      deepwriterService = createDeepwriterService();
    } catch (serviceError) {
      console.error('Failed to initialize DeepWriter service:', serviceError);
      return NextResponse.json(
        { error: 'DeepWriter service unavailable' },
        { status: 503 }
      );
    }

    const updates: StoryStatusUpdate[] = [];
    const errors: string[] = [];

    // Add timeout protection
    const TIMEOUT_MS = 15000; // 15 seconds total timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Status check timeout')), TIMEOUT_MS);
    });

    try {
      // Check each story's job status with timeout protection
      await Promise.race([
        (async () => {
          for (const story of stories) {
      if (!story.generation_job_id) {
        console.warn(`Story ${story.id} has no job ID, marking as failed`);
        
        // Mark story as failed if it's generating but has no job ID
        const updateData: StoryStatusUpdate = {
          id: story.id,
          status: 'failed',
          generation_progress: 0,
          updated_at: new Date().toISOString(),
        };

        // Update in database
        const { error: updateError } = await supabase
          .from('stories')
          .update({
            status: 'failed',
            generation_progress: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', story.id);

        if (updateError) {
          console.error(`Error updating story ${story.id} to failed:`, updateError);
          errors.push(`Story ${story.id}: Failed to update status`);
        } else {
          updates.push(updateData);
          console.log(`Marked story ${story.id} as failed (no job ID)`);
        }
        
        continue;
      }

      try {
        // Check job status from DeepWriter
        const jobStatus = await deepwriterService.checkJobStatus(story.generation_job_id);
        
        let newStatus: 'generating' | 'completed' | 'failed' = story.status as 'generating' | 'completed' | 'failed';
        let newProgress = story.generation_progress;

        // Map DeepWriter job status to our story status
        switch (jobStatus.status) {
          case 'completed':
            newStatus = 'completed';
            newProgress = 100;
            break;
          case 'failed':
          case 'cancelled':
            newStatus = 'failed';
            break;
          case 'processing':
            newStatus = 'generating';
            newProgress = Math.max(jobStatus.progress || 0, story.generation_progress);
            break;
          case 'pending':
            newStatus = 'generating';
            // Keep existing progress for pending jobs
            break;
        }

        // Only update if status or progress changed
        if (newStatus !== story.status || newProgress !== story.generation_progress) {
          const updateData: StoryStatusUpdate = {
            id: story.id,
            status: newStatus,
            generation_progress: newProgress,
            updated_at: new Date().toISOString(),
          };


          // If completed, we might want to fetch the content later
          if (newStatus === 'completed') {
            updateData.generation_progress = 100;
          }

          // Update in database
          const { error: updateError } = await supabase
            .from('stories')
            .update(updateData)
            .eq('id', story.id);

          if (updateError) {
            console.error(`Error updating story ${story.id}:`, updateError);
          } else {
            updates.push({
              id: story.id,
              status: newStatus,
              generation_progress: newProgress,
            });

            console.log(`Updated story ${story.id}: ${story.status} -> ${newStatus} (${newProgress}%)`);
          }
        }

      } catch (jobError) {
        console.error(`Error checking job status for story ${story.id}:`, jobError);
        const errorMsg = `Story ${story.id}: ${jobError instanceof Error ? jobError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        // Don't fail the entire batch for one error
        continue;
          }
        }
        })(),
        timeoutPromise
      ]);
    } catch (timeoutError) {
      if (timeoutError instanceof Error && timeoutError.message === 'Status check timeout') {
        console.warn('Status check timed out, returning partial results');
        // Return partial results if available
      } else {
        throw timeoutError;
      }
    }

    return NextResponse.json({
      success: true,
      updates,
      checked: stories.length,
      updated: updates.length,
      errors: errors.length > 0 ? errors : undefined,
      partial: errors.length > 0 && updates.length > 0,
    });

  } catch (error) {
    console.error('Story status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}