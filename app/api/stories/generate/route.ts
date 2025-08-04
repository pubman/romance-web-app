import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';
import { generateDeepWriterPrompt } from '@/lib/deepwriter/prompt-generator';
import { mapStoryPreferencesToConfig } from '@/lib/deepwriter/config-mapper';

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
    const supabase = await createClient();
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

    // Generate the DeepWriter prompt
    const deepwriterPrompt = generateDeepWriterPrompt(preferences);

    // Create story record in database
    console.log('Creating story record for user:', {
      userId: user.id,
      title,
      genre: preferences.genre,
      mood: preferences.mood
    });

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

    console.log('Story record created successfully:', {
      storyId: story.id,
      status: story.status,
      title: story.title
    });

    try {
      // Initialize DeepWriter service
      console.log('Initializing DeepWriter service...');
      const deepwriterService = createDeepwriterService();
      console.log('DeepWriter service initialized successfully');

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
        title,
        user.email || user.id
      );

      // Map story preferences to enhanced DeepWriter configuration
      const generationConfig = mapStoryPreferencesToConfig(preferences);

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

      console.log('Updating story with job ID:', {
        storyId: story.id,
        jobId: job.id,
        jobMessage: job.message,
        jobStatus: job.status
      });

      // Create job tracking record with enhanced metadata
      const { error: jobError } = await supabase
        .from('stories')
        .update({
          generation_job_id: job.id,
          updated_at: new Date().toISOString(),
          // Store generation config for future reference
          generation_metadata: {
            config: generationConfig,
            enhanced_mode: true,
            fallback_used: job.message?.includes('fallback') || false,
            job_created_at: job.created_at,
          },
        })
        .eq('id', story.id);

      if (jobError) {
        console.error('Job tracking error:', jobError);
        throw new Error(`Failed to update story with job ID: ${jobError.message}`);
      }

      console.log('Story successfully updated with job ID:', {
        storyId: story.id,
        jobId: job.id
      });

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
        generation: {
          enhanced_mode: true,
          config: {
            page_length: generationConfig.pageLength,
            max_pages: generationConfig.maxPages,
            table_of_contents: generationConfig.enableTableOfContents,
            technical_diagrams: generationConfig.enableTechnicalDiagrams,
            web_research: generationConfig.useWebResearch,
          },
        },
      });

    } catch (deepwriterError) {
      console.error('DeepWriter API error:', deepwriterError);
      
      let errorMessage = 'Failed to start story generation';
      let errorDetails = 'Unknown error';
      let statusCode = 500;
      
      // Handle different error types
      if (deepwriterError instanceof Error) {
        console.error('Error message:', deepwriterError.message);
        console.error('Error stack:', deepwriterError.stack);
        errorDetails = deepwriterError.message;
        
        // Check if it's a validation error from our prompt generator
        if (deepwriterError.message.includes('Generated prompt') || 
            deepwriterError.message.includes('required')) {
          errorMessage = 'Story configuration validation failed';
          statusCode = 400;
        }
        
        // If it's a DeepWriter API error, provide more specific feedback
        if (deepwriterError && typeof deepwriterError === 'object' && 'status' in deepwriterError) {
          const status = (deepwriterError as any).status;
          const response = (deepwriterError as any).response;
          
          console.error('DeepWriter API status:', status);
          console.error('DeepWriter API response:', response);
          
          statusCode = status;
          
          // Provide user-friendly error messages based on status
          switch (status) {
            case 400:
              errorMessage = 'Invalid story configuration provided to DeepWriter';
              errorDetails = response?.message || deepwriterError.message;
              break;
            case 401:
              errorMessage = 'DeepWriter API authentication failed';
              errorDetails = 'API key may be invalid or expired';
              break;
            case 403:
              errorMessage = 'Access denied by DeepWriter API';
              errorDetails = 'Check API permissions and account status';
              break;
            case 429:
              errorMessage = 'DeepWriter API rate limit exceeded';
              errorDetails = 'Please try again in a few minutes';
              break;
            case 500:
              errorMessage = 'DeepWriter service error';
              errorDetails = 'External service is temporarily unavailable';
              break;
            default:
              errorMessage = `DeepWriter API error (${status})`;
              errorDetails = response?.message || deepwriterError.message;
          }
        }
      }

      // Update story status to failed with error details
      await supabase
        .from('stories')
        .update({
          status: 'failed',
          error_message: errorDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', story.id);

      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          code: statusCode 
        },
        { status: statusCode }
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