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
      // Get PDF from DeepWriter service
      const deepwriterService = createDeepwriterService();
      const pdfResponse = await deepwriterService.downloadPdf(story.generation_job_id);

      // Sanitize filename for download
      const safeTitle = story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const filename = `${safeTitle}.pdf`;

      // Return PDF with attachment disposition for download
      return new NextResponse(pdfResponse, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfResponse.byteLength.toString(),
        },
      });

    } catch (deepwriterError) {
      console.error('DeepWriter PDF download error:', deepwriterError);
      return NextResponse.json(
        { error: 'Failed to download PDF from generation service' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('PDF download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}