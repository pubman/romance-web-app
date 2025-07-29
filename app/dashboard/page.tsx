import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { StoryGrid } from "@/components/story-grid";
import { CreateStoryButton } from "@/components/create-story-button";
import { Heart, BookOpen, Users } from "lucide-react";
import { BuyCreditsCta } from "@/components/buy-credits-cta";

export default async function DashboardPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();
	if (error || !data?.claims) {
		redirect("/auth/login");
	}

	const userStories = [
		{
			id: "1",
			title: "Love in the Vineyard",
			genre: "Contemporary",
			createdAt: "2024-01-15",
			excerpt:
				"Sarah never expected to find love while managing her family's struggling vineyard...",
			isPublic: false,
			characters: ["Sarah", "Marco"],
		},
		{
			id: "2",
			title: "The Duke's Secret",
			genre: "Historical",
			createdAt: "2024-01-10",
			excerpt:
				"In Regency London, Lady Catherine discovers that the mysterious Duke harbors a secret that could change everything...",
			isPublic: true,
			characters: ["Lady Catherine", "Duke Alexander"],
		},
	];

	const sharedStories = [
		{
			id: "3",
			title: "Midnight in Paris",
			genre: "Contemporary",
			author: "Emma Wilson",
			sharedAt: "2024-01-12",
			excerpt:
				"A chance encounter at the Eiffel Tower leads to an unexpected romance...",
			characters: ["Sophie", "Jean-Luc"],
		},
	];

	return (
		<div className="min-h-screen bg-romantic-gradient">
			<DashboardHeader />

			<main className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-4xl font-heading text-foreground mb-2">
						Welcome back, writer
					</h1>
					<p className="text-muted-foreground text-lg">
						Ready to craft your next romantic tale?
					</p>
				</div>
				<BuyCreditsCta />

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
						<div className="flex items-center gap-3 mb-2">
							<Heart className="h-5 w-5 text-primary" />
							<h3 className="font-semibold">Your Stories</h3>
						</div>
						<p className="text-2xl font-heading text-primary">
							{userStories.length}
						</p>
						<p className="text-sm text-muted-foreground">Stories created</p>
					</div>

					<div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
						<div className="flex items-center gap-3 mb-2">
							<Users className="h-5 w-5 text-primary" />
							<h3 className="font-semibold">Shared</h3>
						</div>
						<p className="text-2xl font-heading text-primary">
							{sharedStories.length}
						</p>
						<p className="text-sm text-muted-foreground">
							Stories shared with you
						</p>
					</div>

					<div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
						<div className="flex items-center gap-3 mb-2">
							<BookOpen className="h-5 w-5 text-primary" />
							<h3 className="font-semibold">Reading</h3>
						</div>
						<p className="text-2xl font-heading text-primary">3</p>
						<p className="text-sm text-muted-foreground">Stories in progress</p>
					</div>
				</div>

				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-heading">Your Stories</h2>
					<CreateStoryButton />
				</div>

				<StoryGrid stories={userStories} showAuthor={false} />

				{sharedStories.length > 0 && (
					<>
						<div className="flex items-center justify-between mb-6 mt-12">
							<h2 className="text-2xl font-heading">Shared with You</h2>
						</div>
						<StoryGrid stories={sharedStories} showAuthor={true} />
					</>
				)}
			</main>
		</div>
	);
}
