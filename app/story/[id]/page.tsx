import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryDetails } from "@/components/story-details";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface StoryPageProps {
	params: Promise<{ id: string }>;
}

// Transform DatabaseStory to StoryDetailsProps format
function transformStoryData(
	dbStory: DatabaseStory & { generation_job_id?: string },
	content: string
): unknown {
	// Extract character names from wizard_data
	const characters = [];
	if (dbStory.wizard_data?.characters?.protagonist?.name) {
		characters.push(dbStory.wizard_data.characters.protagonist.name);
	}
	if (dbStory.wizard_data?.characters?.love_interest?.name) {
		characters.push(dbStory.wizard_data.characters.love_interest.name);
	}

	// Extract genre from story preferences
	const genre =
		dbStory.story_preferences?.elements?.genre ||
		dbStory.story_preferences?.genre ||
		"Romance";

	// Extract setting from wizard_data or use default
	const setting =
		dbStory.wizard_data?.setting?.location ||
		dbStory.wizard_data?.setting?.atmosphere ||
		"Unknown Location";

	// Use content_url directly as PDF URL
	const pdfUrl = dbStory.status === "completed" ? dbStory.content_url : null;

	// Estimate page count based on word count (roughly 250 words per page)
	const estimatedPageCount =
		dbStory.word_count > 0
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
		jobStatus:
			dbStory.status === "completed"
				? ("completed" as const)
				: dbStory.status === "failed"
				? ("failed" as const)
				: dbStory.status === "generating"
				? ("processing" as const)
				: ("pending" as const),
		errorMessage:
			dbStory.status === "failed" ? "Story generation failed" : null,
	};
}

export default async function StoryPage({ params }: StoryPageProps) {
	const supabase = await createClient();
	const { id } = await params;

	// Get authenticated user
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		redirect("/auth/login");
	}

	// Fetch story from database
	const { data: dbStory, error: storyError } = await supabase
		.from("stories")
		.select(
			`
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
    `
		)
		.eq("id", id)
		.eq("user_id", user.id) // Ensure user owns this story
		.single();

	if (storyError || !dbStory) {
		redirect("/dashboard"); // Redirect if story not found or no access
	}

	// Since we're only showing PDF view, we don't need to fetch text content
	const content = ""; // Placeholder - not used in PDF-only view

	const transformedStory = transformStoryData(
		dbStory as DatabaseStory,
		content
	);

	return <StoryDetails story={transformedStory} />;
}
