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

    // Get story details
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
        title,
        status,
        generation_job_id,
        content_url,
        word_count,
        chapter_count
      `)
      .eq('id', storyId)
      .eq('user_id', user.id)  // Ensure user owns this story
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // If story is not completed, return placeholder content
    if (story.status !== 'completed') {
      const placeholderContent = `# ${story.title}

**Status**: ${story.status.charAt(0).toUpperCase() + story.status.slice(1)}

${story.status === 'generating' 
  ? 'Your story is currently being generated. Please check back in a few minutes!' 
  : story.status === 'failed'
  ? 'Story generation failed. Please try creating a new story.'
  : 'This story is still in draft mode. Complete the story wizard to generate your content.'
}

---
*Word Count*: ${story.word_count || 0} words  
*Chapters*: ${story.chapter_count || 0}
`;

      return NextResponse.json({
        content: placeholderContent,
        status: story.status,
        isGenerated: false,
        metadata: {
          wordCount: story.word_count || 0,
          chapterCount: story.chapter_count || 0,
        }
      });
    }

    // For completed stories, try to fetch actual content from DeepWriter
    try {
      if (story.generation_job_id) {
        console.log(`Fetching content for job ID: ${story.generation_job_id}`);
        
        // Create DeepWriter service
        const deepwriterService = createDeepwriterService();
        
        // First, check job status to ensure it's ready
        try {
          const jobStatus = await deepwriterService.checkJobStatus(story.generation_job_id);
          console.log(`Job status for ${story.generation_job_id}:`, jobStatus.status);
          
          if (jobStatus.status !== 'completed') {
            return NextResponse.json({
              content: `# ${story.title}

**Job Status**: ${jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}

${jobStatus.status === 'processing' || jobStatus.status === 'pending'
  ? `Your story is currently being generated (${jobStatus.progress || 0}% complete). Please check back in a few minutes!`
  : jobStatus.status === 'failed'
  ? `Story generation failed: ${jobStatus.error || 'Unknown error'}`
  : `Job status: ${jobStatus.status}`
}

---
*Word Count*: ${story.word_count || 0} words  
*Chapters*: ${story.chapter_count || 0}`,
              status: jobStatus.status,
              isGenerated: false,
              metadata: {
                wordCount: story.word_count || 0,
                chapterCount: story.chapter_count || 0,
                jobProgress: jobStatus.progress || 0,
              }
            });
          }
        } catch (statusError) {
          console.error(`Failed to check job status for ${story.generation_job_id}:`, statusError);
          // Continue to try fetching content directly
        }

        // Fetch content from DeepWriter service
        const jobContent = await deepwriterService.getJobContent(story.generation_job_id);
        console.log(`Successfully fetched content for job ${story.generation_job_id}`);

        // Transform DeepWriter content to markdown format
        let markdownContent = `# ${story.title}\n\n`;
        
        if (jobContent.content.chapters && jobContent.content.chapters.length > 0) {
          jobContent.content.chapters.forEach((chapter, index) => {
            if (chapter.title && chapter.title !== story.title) {
              markdownContent += `## Chapter ${index + 1}: ${chapter.title}\n\n`;
            } else if (jobContent.content.chapters.length > 1) {
              markdownContent += `## Chapter ${index + 1}\n\n`;
            }
            markdownContent += `${chapter.content}\n\n`;
          });
        } else {
          // Fallback if no chapters structure
          markdownContent += 'Your generated story content would appear here.\n\n';
          markdownContent += '*Content structure may vary based on generation parameters.*';
        }

        return NextResponse.json({
          content: markdownContent,
          status: story.status,
          isGenerated: true,
          metadata: {
            wordCount: jobContent.content.metadata?.word_count || story.word_count || 0,
            chapterCount: jobContent.content.metadata?.chapter_count || story.chapter_count || 0,
            readingTime: jobContent.content.metadata?.reading_time || 0,
            generatedAt: jobContent.content.metadata?.generated_at,
          }
        });

      } else {
        // No generation job ID - return placeholder
        const fallbackContent = `# ${story.title}

This story has been marked as completed but no generation job ID is available.

This might happen if:
- The story was created before the AI generation system was implemented
- There was an issue with the generation process
- The job ID was not properly stored

---
*Word Count*: ${story.word_count || 0} words  
*Chapters*: ${story.chapter_count || 0}
`;

        return NextResponse.json({
          content: fallbackContent,
          status: story.status,
          isGenerated: false,
          metadata: {
            wordCount: story.word_count || 0,
            chapterCount: story.chapter_count || 0,
          }
        });
      }

    } catch (contentError) {
      console.error('Error fetching story content from DeepWriter:', contentError);
      
      // Determine error type and message
      const isDeepwriterError = contentError && typeof contentError === 'object' && 'status' in contentError;
      const errorStatus = isDeepwriterError ? (contentError as { status: number }).status : null;
      const errorMessage = contentError instanceof Error ? contentError.message : 'Unknown error';
      
      // Return error content but don't fail the request
      const errorContent = `# ${story.title}

**Error loading story content from DeepWriter**

${errorStatus === 404 
  ? `The generation job (ID: ${story.generation_job_id}) was not found on DeepWriter servers. This may happen if the job has expired or was cleaned up.`
  : errorStatus === 401 || errorStatus === 403
  ? `Authentication issue with DeepWriter API. Please check API configuration.`
  : errorStatus
  ? `DeepWriter API returned error ${errorStatus}: ${errorMessage}`
  : `System error while contacting DeepWriter: ${errorMessage}`
}

**Troubleshooting Steps:**
1. Refresh the page to retry
2. Check back in a few minutes if the job is still processing
3. Contact support if the issue persists

**Technical Details:**
- Story Status: ${story.status}
- Generation Job ID: ${story.generation_job_id || 'Not available'}
- Error Type: ${errorStatus ? `HTTP ${errorStatus}` : 'Network/System error'}
- DeepWriter API: ${process.env.DEEPWRITER_API_URL || 'Not configured'}

---
*Word Count*: ${story.word_count || 0} words  
*Chapters*: ${story.chapter_count || 0}
`;

      return NextResponse.json({
        content: errorContent,
        status: story.status,
        isGenerated: false,
        error: errorStatus === 404 ? 'Job not found' : errorStatus ? `API error ${errorStatus}` : 'System error',
        metadata: {
          wordCount: story.word_count || 0,
          chapterCount: story.chapter_count || 0,
          hasJobId: !!story.generation_job_id,
          errorDetails: {
            status: errorStatus,
            message: errorMessage,
            apiUrl: process.env.DEEPWRITER_API_URL,
            hasApiKey: !!process.env.DEEPWRITER_API_KEY,
          }
        }
      });
    }

  } catch (error) {
    console.error('Story content fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}