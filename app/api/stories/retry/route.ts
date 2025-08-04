import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';
import { generateDeepWriterPrompt } from '@/lib/deepwriter/prompt-generator';
import { mapStoryPreferencesToConfig } from '@/lib/deepwriter/config-mapper';

interface RetryStoryRequest {
  storyId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RetryStoryRequest = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
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

    // Fetch the story to retry - must be user's story and failed status
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .eq('status', 'failed')
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found or not eligible for retry' },
        { status: 404 }
      );
    }

    // Validate story has wizard_data for regeneration
    if (!story.wizard_data) {
      return NextResponse.json(
        { error: 'Story missing generation preferences' },
        { status: 400 }
      );
    }

    // Check user credits (using existing credit system)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining, credits_used')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to check user profile' },
        { status: 500 }
      );
    }

    if (profile.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    console.log('Retrying story generation for:', {
      storyId: story.id,
      userId: user.id,
      title: story.title,
      previousError: story.error_message
    });

    // Generate the DeepWriter prompt from saved preferences
    const deepwriterPrompt = generateDeepWriterPrompt(story.wizard_data);

    try {
      // Initialize DeepWriter service
      const deepwriterService = createDeepwriterService();

      // Create new DeepWriter project
      const project = await deepwriterService.createProject(
        story.title,
        user.email || user.id
      );

      // Update project with generated prompt
      await deepwriterService.updateProject(
        project.id,
        deepwriterPrompt,
        user.email || user.id,
        story.title,
        user.email || user.id
      );

      // Map story preferences to enhanced DeepWriter configuration
      const generationConfig = mapStoryPreferencesToConfig(story.wizard_data);

      // Generate work with enhanced parameters, with fallback to legacy mode
      let job;
      try {
        job = await deepwriterService.generateRomanceWork(
          project.id,
          deepwriterPrompt,
          user.email || user.id,
          user.email || user.id,
          generationConfig
        );
      } catch (enhancedError) {
        console.warn('Enhanced generation failed, falling back to basic mode:', enhancedError);
        
        // Fallback to basic generation mode
        job = await deepwriterService.generateWork(project.id, {
          is_default: true
        });
      }

      // Validate job object before updating story
      if (!job || !job.id) {
        throw new Error('DeepWriter job creation failed - no job ID returned');
      }

      console.log('Retry job created successfully:', {
        storyId: story.id,
        jobId: job.id,
        projectId: project.id
      });

      // Update existing story record for retry
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          status: 'generating',
          generation_job_id: job.id,
          generation_progress: 0,
          error_message: null, // Clear previous error
          updated_at: new Date().toISOString(),
          // Store retry metadata
          generation_metadata: {
            config: generationConfig,
            enhanced_mode: true,
            retry: true,
            retry_timestamp: new Date().toISOString(),
            previous_error: story.error_message,
            project_id: project.id,
          },
        })
        .eq('id', story.id);

      if (updateError) {
        console.error('Story retry update error:', updateError);
        throw new Error(`Failed to update story for retry: ${updateError.message}`);
      }

      // Consume user credit
      await supabase
        .from('profiles')
        .update({
          credits_remaining: profile.credits_remaining - 1,
          credits_used: (profile.credits_used || 0) + 1,
        })
        .eq('user_id', user.id);

      console.log('Story retry initiated successfully:', {
        storyId: story.id,
        jobId: job.id,
        title: story.title
      });

      return NextResponse.json({
        success: true,
        story: {
          id: story.id,
          title: story.title,
          status: 'generating',
          generation_progress: 0,
        },
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
        },
        retry: true,
        message: 'Story retry initiated successfully',
      });

    } catch (deepwriterError) {
      console.error('DeepWriter retry error:', deepwriterError);
      
      let errorMessage = 'Failed to retry story generation';
      let errorDetails = 'Unknown error';
      let statusCode = 500;
      
      // Handle different error types
      if (deepwriterError instanceof Error) {
        errorDetails = deepwriterError.message;
        
        // Check for specific error types
        if (deepwriterError.message.includes('API key') || 
            deepwriterError.message.includes('authentication')) {
          errorMessage = 'DeepWriter API authentication failed';
          statusCode = 503;
        }
      }

      // Mark story as failed again with new error
      await supabase
        .from('stories')
        .update({
          status: 'failed',
          error_message: `Retry failed: ${errorDetails}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', story.id);

      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          retry: true,
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('Story retry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}