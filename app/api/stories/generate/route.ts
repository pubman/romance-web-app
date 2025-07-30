import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';
import { generateDeepWriterPrompt } from '@/lib/deepwriter/prompt-generator';

interface GenerateStoryRequest {
  title: string;
  preferences: {
    genre: string;
    mood: string;
    characters: {
      protagonist: { name: string; traits: string[]; occupation: string };
      love_interest: { name: string; traits: string[]; occupation: string };
    };
    setting: {
      time_period: string;
      location: string;
      atmosphere: string;
    };
    elements: {
      tropes: string[];
      heat_level: string;
      story_length: string;
      conflict_type: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateStoryRequest = await request.json();
    const { title, preferences } = body;

    // Validate required fields
    if (!title || !preferences) {
      return NextResponse.json(
        { error: 'Title and preferences are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user credits (using existing credit system)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining')
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

    // Generate the DeepWriter prompt
    const deepwriterPrompt = generateDeepWriterPrompt(preferences);

    // Create story record in database
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        title,
        status: 'generating',
        wizard_data: preferences,
        story_preferences: {
          genre: preferences.genre,
          elements: preferences.elements,
        },
        generation_progress: 0,
      })
      .select()
      .single();

    if (storyError) {
      console.error('Story creation error:', storyError);
      return NextResponse.json(
        { error: 'Failed to create story record' },
        { status: 500 }
      );
    }

    try {
      // Initialize DeepWriter service
      const deepwriterService = createDeepwriterService();

      // Create DeepWriter project
      const project = await deepwriterService.createProject(
        title,
        user.email || user.id
      );

      // Update project with generated prompt
      await deepwriterService.updateProject(
        project.id,
        deepwriterPrompt,
        user.email || user.id,
        title
      );

      // Generate work
      const job = await deepwriterService.generateWork(project.id);

      // Create job tracking record
      const { error: jobError } = await supabase
        .from('stories')
        .update({
          generation_job_id: job.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', story.id);

      if (jobError) {
        console.error('Job tracking error:', jobError);
        // Continue anyway, we can still track the story
      }

      // Consume user credit
      await supabase
        .from('profiles')
        .update({
          credits_remaining: profile.credits_remaining - 1,
          credits_used: (profile.credits_used || 0) + 1,
        })
        .eq('user_id', user.id);

      return NextResponse.json({
        success: true,
        story: {
          id: story.id,
          title: story.title,
          status: story.status,
          generation_progress: story.generation_progress,
        },
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
        },
      });

    } catch (deepwriterError) {
      console.error('DeepWriter API error:', deepwriterError);

      // Update story status to failed
      await supabase
        .from('stories')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', story.id);

      return NextResponse.json(
        { error: 'Failed to start story generation' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}