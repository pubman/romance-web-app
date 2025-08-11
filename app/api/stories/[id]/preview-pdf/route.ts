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
      .select('id, user_id, status, generation_job_id, title')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if story has a generation job and is completed
    if (!story.generation_job_id) {
      return NextResponse.json(
        { error: 'PDF not available - no generation job' },
        { status: 404 }
      );
    }

    if (story.status !== 'completed') {
      return NextResponse.json(
        { error: 'PDF not ready - story generation not completed' },
        { status: 404 }
      );
    }

    try {
      console.log(`Fetching PDF for job ID: ${story.generation_job_id}`);
      
      // Get PDF from DeepWriter service
      const deepwriterService = createDeepwriterService();
      
      // First check job status
      try {
        const jobStatus = await deepwriterService.checkJobStatus(story.generation_job_id);
        console.log(`PDF job status for ${story.generation_job_id}:`, jobStatus.status);
        
        if (jobStatus.status !== 'completed') {
          return NextResponse.json(
            { 
              error: `PDF not ready - job status: ${jobStatus.status}`,
              details: {
                status: jobStatus.status,
                progress: jobStatus.progress || 0,
                message: jobStatus.message
              }
            },
            { status: 202 } // Accepted but not ready
          );
        }
      } catch (statusError) {
        console.error(`Failed to check PDF job status for ${story.generation_job_id}:`, statusError);
        // Continue to try downloading PDF directly
      }

      const pdfResponse = await deepwriterService.previewPdf(story.generation_job_id);
      console.log(`Successfully fetched PDF for job ${story.generation_job_id}`);

      // Return PDF with inline disposition for iframe viewing
      return new NextResponse(pdfResponse, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        },
      });

    } catch (deepwriterError) {
      console.error('DeepWriter PDF fetch error:', deepwriterError);
      
      // Determine error type for better user feedback
      const errorStatus = deepwriterError && typeof deepwriterError === 'object' && 'status' in deepwriterError
        ? (deepwriterError as { status: number }).status 
        : null;
      const errorMessage = deepwriterError instanceof Error ? deepwriterError.message : 'Unknown error';
      
      return NextResponse.json(
        { 
          error: errorStatus === 404 
            ? 'PDF not found - job may have expired or been cleaned up'
            : errorStatus === 401 || errorStatus === 403
            ? 'Authentication issue with DeepWriter API'
            : 'Failed to fetch PDF from generation service',
          details: {
            jobId: story.generation_job_id,
            status: errorStatus,
            message: errorMessage,
            apiUrl: process.env.DEEPWRITER_API_URL,
            hasApiKey: !!process.env.DEEPWRITER_API_KEY,
          }
        },
        { status: errorStatus || 503 }
      );
    }

  } catch (error) {
    console.error('PDF preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}