import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryDetails } from "@/components/story-details";

interface StoryPageProps {
	params: Promise<{ id: string }>;
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
      author,
      status,
      is_public,
      word_count,
      chapter_count,
      story_preferences,
      wizard_data,
      generation_progress,
      generation_job_id,
      content_url,
      page_count,
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

	// Fetch PDF data directly from DeepWriter for completed stories
	const hasPdfCapability = Boolean(dbStory.generation_job_id);
	if (hasPdfCapability && dbStory.status === "completed") {
		try {
			const { createDeepwriterService } = await import(
				"@/lib/deepwriter/service"
			);
			const deepwriterService = createDeepwriterService();

			console.log(`Fetching PDF data for job ID: ${dbStory.generation_job_id}`);
			const pdfArrayBuffer = await deepwriterService.previewPdf(
				dbStory.generation_job_id
			);

			// Convert ArrayBuffer to base64 data URL
			const pdfBase64 = Buffer.from(pdfArrayBuffer).toString("base64");
			dbStory.content_url = `data:application/pdf;base64,${pdfBase64}`;

			console.log(
				`Successfully fetched PDF data for job ${dbStory.generation_job_id}`
			);
		} catch (pdfError) {
			console.error("Error fetching PDF data from DeepWriter:", pdfError);
			// pdfUrl remains null, will show error in component
		}
	}

	// Calculate page count estimate
	if (dbStory.word_count > 0) {
		dbStory.page_count = Math.max(1, Math.ceil(dbStory.word_count / 250));
	}

	return <StoryDetails story={dbStory} />;
}
