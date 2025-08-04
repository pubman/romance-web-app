import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryDetails } from "@/components/story-details";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface StoryPageProps {
  params: Promise<{ id: string }>;
}

// Transform DatabaseStory to StoryDetailsProps format
function transformStoryData(dbStory: DatabaseStory & { generation_job_id?: string }, content: string): any {
  // Extract character names from wizard_data
  const characters = [];
  if (dbStory.wizard_data?.characters?.protagonist?.name) {
    characters.push(dbStory.wizard_data.characters.protagonist.name);
  }
  if (dbStory.wizard_data?.characters?.love_interest?.name) {
    characters.push(dbStory.wizard_data.characters.love_interest.name);
  }

  // Extract genre from story preferences
  const genre = dbStory.story_preferences?.elements?.genre || 
                dbStory.story_preferences?.genre || 
                'Romance';

  // Extract setting from wizard_data or use default
  const setting = dbStory.wizard_data?.setting?.location || 
                  dbStory.wizard_data?.setting?.atmosphere ||
                  'Unknown Location';

  // Determine PDF capabilities based on generation job
  const hasPdfCapability = Boolean(dbStory.generation_job_id);
  const pdfUrl = hasPdfCapability && dbStory.status === 'completed' 
    ? `/api/stories/${dbStory.id}/preview-pdf` 
    : null;

  // Estimate page count based on word count (roughly 250 words per page)
  const estimatedPageCount = dbStory.word_count > 0 
    ? Math.max(1, Math.ceil(dbStory.word_count / 250))
    : null;

  return {
    id: dbStory.id,
    title: dbStory.title,
    genre,
    author: "You", // Since it's the user's story
    createdAt: dbStory.created_at,
    isPublic: dbStory.is_public,
    characters,
    setting,
    content,
    preferences: dbStory.story_preferences,
    // PDF-related properties
    pdfUrl,
    jobId: dbStory.generation_job_id || null,
    generatedAt: dbStory.updated_at,
    pageCount: estimatedPageCount,
    jobStatus: dbStory.status === 'completed' ? 'completed' as const : 
               dbStory.status === 'failed' ? 'failed' as const :
               dbStory.status === 'generating' ? 'processing' as const : 
               'pending' as const,
    errorMessage: dbStory.status === 'failed' ? 'Story generation failed' : null,
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch story from database
  const { data: dbStory, error: storyError } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      description,
      cover_image_url,
      status,
      is_public,
      word_count,
      chapter_count,
      story_preferences,
      wizard_data,
      generation_progress,
      generation_job_id,
      content_url,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("user_id", user.id)  // Ensure user owns this story
    .single();

  if (storyError || !dbStory) {
    redirect("/dashboard"); // Redirect if story not found or no access
  }

  // Fetch actual story content from our content API
  let content = `# ${dbStory.title}

Loading your story content...`;

  try {
    // For server-side fetching, we'll create the content directly rather than making an HTTP call
    // This avoids the need to forward cookies and is more efficient
    if (dbStory.status === 'completed' && dbStory.generation_job_id) {
      try {
        const { createDeepwriterService } = await import('@/lib/deepwriter/service');
        const deepwriterService = createDeepwriterService();
        const jobContent = await deepwriterService.getJobContent(dbStory.generation_job_id);

        // Transform DeepWriter content to markdown format
        let markdownContent = `# ${dbStory.title}\n\n`;
        
        if (jobContent.content.chapters && jobContent.content.chapters.length > 0) {
          jobContent.content.chapters.forEach((chapter: any, index: number) => {
            if (chapter.title && chapter.title !== dbStory.title) {
              markdownContent += `## Chapter ${index + 1}: ${chapter.title}\n\n`;
            } else if (jobContent.content.chapters.length > 1) {
              markdownContent += `## Chapter ${index + 1}\n\n`;
            }
            markdownContent += `${chapter.content}\n\n`;
          });
        }
        
        content = markdownContent;
      } catch (deepwriterError) {
        console.error('Error fetching content from DeepWriter:', deepwriterError);
        // Fall through to use fallback content
      }
    }

    // If we still have the loading content, provide fallback based on story status
    if (content.includes('Loading your story content...')) {
      content = `# ${dbStory.title}

**Story Status**: ${dbStory.status.charAt(0).toUpperCase() + dbStory.status.slice(1)}

${dbStory.status === 'completed' 
  ? 'Your story has been generated successfully!' 
  : dbStory.status === 'generating'
  ? 'Your story is currently being generated. Please check back soon!'
  : dbStory.status === 'failed'
  ? 'Story generation encountered an issue. Please try creating a new story.'
  : 'This story is in draft mode. Complete the story wizard to generate your content.'
}

---
**Generation Progress**: ${dbStory.generation_progress}%  
**Word Count**: ${dbStory.word_count || 0} words  
**Chapters**: ${dbStory.chapter_count || 0}
`;
    }
  } catch (contentError) {
    console.error('Failed to fetch story content:', contentError);
    // Use fallback content on error
  }

  const transformedStory = transformStoryData(dbStory as DatabaseStory, content);

  return <StoryDetails story={transformedStory} />;
}