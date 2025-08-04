import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      if (story.content_url) {
        // Fetch content from the stored content URL
        const contentResponse = await fetch(story.content_url);
        
        if (contentResponse.ok) {
          const contentText = await contentResponse.text();
          
          // Format content with title if needed
          let formattedContent;
          if (contentText.trim().startsWith('#') || contentText.includes('## ')) {
            formattedContent = contentText;
          } else {
            formattedContent = `# ${story.title}\n\n${contentText}`;
          }

          return NextResponse.json({
            content: formattedContent,
            status: story.status,
            isGenerated: true,
            metadata: {
              wordCount: story.word_count || 0,
              chapterCount: story.chapter_count || 0,
            }
          });
        } else {
          console.error('Failed to fetch content from content_url:', contentResponse.status);
          // Fall through to error handling
        }
      } else {
        // No content URL - return placeholder
        const fallbackContent = `# ${story.title}

This story has been marked as completed but no content URL is available.

This might happen if:
- The story was created before the content storage system was implemented
- There was an issue with the content storage process
- The story content has not been properly stored yet

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
      
      // Determine if it's a content_url fetch error or other error
      const isContentUrlError = story.content_url && contentError instanceof Error;
      
      // Return error content but don't fail the request
      const errorContent = `# ${story.title}

**Error loading story content**

${isContentUrlError 
  ? `We encountered an issue loading your story content from the stored location.`
  : `We encountered a system error while trying to load your story content.`
}

This is usually temporary. Please try:
1. Refreshing the page
2. Checking back in a few minutes
3. Contacting support if the issue persists

**Troubleshooting Information:**
- Status: ${story.status}
- Content URL: ${story.content_url ? 'Available' : 'Not available'}
- Error Type: ${isContentUrlError ? 'Content fetch error' : 'System error'}

---
*Word Count*: ${story.word_count || 0} words  
*Chapters*: ${story.chapter_count || 0}
`;

      return NextResponse.json({
        content: errorContent,
        status: story.status,
        isGenerated: false,
        error: isContentUrlError ? 'Content fetch failed' : 'System error',
        metadata: {
          wordCount: story.word_count || 0,
          chapterCount: story.chapter_count || 0,
          hasContentUrl: !!story.content_url,
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