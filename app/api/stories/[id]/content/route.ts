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

    // For completed stories, try to fetch actual content
    try {
      if (story.generation_job_id) {
        // Fetch content from DeepWriter service
        const deepwriterService = createDeepwriterService();
        const jobContent = await deepwriterService.getJobContent(story.generation_job_id);

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
          markdownContent += '*This is a placeholder - actual content integration depends on the DeepWriter service response format.*';
        }

        return NextResponse.json({
          content: markdownContent,
          status: story.status,
          isGenerated: true,
          metadata: {
            wordCount: jobContent.content.metadata?.word_count || story.word_count || 0,
            chapterCount: jobContent.content.metadata?.chapter_count || story.chapter_count || 0,
            readingTime: jobContent.content.metadata?.reading_time || 0,
          }
        });

      } else {
        // No generation job ID - return placeholder
        const fallbackContent = `# ${story.title}

This story has been marked as completed but no generated content is available.

This might happen if:
- The story was created before the AI generation system was implemented
- There was an issue with the content storage process
- The story content is stored in a different location

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
      console.error('Error fetching story content:', contentError);
      
      // Return error content but don't fail the request
      const errorContent = `# ${story.title}

**Error loading story content**

We encountered an issue loading your story content. This is usually temporary.

Please try:
1. Refreshing the page
2. Checking back in a few minutes
3. Contacting support if the issue persists

---
*Status*: ${story.status}  
*Word Count*: ${story.word_count || 0} words
`;

      return NextResponse.json({
        content: errorContent,
        status: story.status,
        isGenerated: false,
        error: 'Failed to load content',
        metadata: {
          wordCount: story.word_count || 0,
          chapterCount: story.chapter_count || 0,
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