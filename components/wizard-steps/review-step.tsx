"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, FileText, Crown } from "lucide-react";
import Link from "next/link";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface ReviewStepProps {
	preferences: DatabaseStory["story_preferences"];
	formattedPrompt: string;
	onGenerate: () => void;
	isGenerating: boolean;
	isGuest: boolean;
}

export function ReviewStep({
	preferences,
	formattedPrompt,
	onGenerate,
	isGenerating,
	isGuest,
}: ReviewStepProps) {
	const getGenreName = (id: string) => {
		const genres: { [key: string]: string } = {
			contemporary: "Contemporary",
			historical: "Historical",
			fantasy: "Fantasy",
			paranormal: "Paranormal",
		};
		return genres[id] || id;
	};

	const getMoodName = (id: string) => {
		const moods: { [key: string]: string } = {
			sweet: "Sweet & Tender",
			passionate: "Passionate",
			dramatic: "Dramatic",
			playful: "Playful",
			mysterious: "Mysterious",
		};
		return moods[id] || id;
	};

	const getTimePeriodName = (id: string) => {
		const periods: { [key: string]: string } = {
			present: "Present Day",
			recent: "Recent Past",
			vintage: "Vintage",
			regency: "Regency",
			victorian: "Victorian",
			medieval: "Medieval",
		};
		return periods[id] || id;
	};

	const getAtmosphereName = (id: string) => {
		const atmospheres: { [key: string]: string } = {
			cozy: "Cozy & Intimate",
			glamorous: "Glamorous",
			rustic: "Rustic & Natural",
			urban: "Urban & Modern",
			exotic: "Exotic & Adventurous",
			mysterious: "Mysterious",
		};
		return atmospheres[id] || id;
	};

	const getHeatLevelName = (id: string) => {
		const levels: { [key: string]: string } = {
			sweet: "Sweet",
			warm: "Warm",
			steamy: "Steamy",
			scorching: "Scorching",
		};
		return levels[id] || id;
	};

	const getStoryLengthName = (id: string) => {
		const lengths: { [key: string]: string } = {
			short: "Short Story",
			novella: "Novella",
			novel: "Full Novel",
		};
		return lengths[id] || id;
	};

	const getConflictTypeName = (id: string) => {
		const types: { [key: string]: string } = {
			internal: "Internal Conflict",
			external: "External Conflict",
			both: "Both",
		};
		return types[id] || id;
	};

	return (
		<div className="space-y-6">
			<div className="text-center mb-8">
				<h3 className="text-xl font-heading mb-2">Final Review</h3>
				<p className="text-muted-foreground">
					Review your story preferences and approved prompt before generation
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Genre & Style</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">Genre:</span>
							<p className="font-medium">
								{getGenreName(preferences?.genre || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Mood:</span>
							<p className="font-medium">
								{getMoodName(preferences?.mood || "")}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Characters</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">
								Main Character:
							</span>
							<p className="font-medium">
								{preferences?.characters?.protagonist?.name}
							</p>
							<p className="text-sm text-muted-foreground">
								{preferences?.characters?.protagonist?.occupation}
							</p>
							<div className="flex flex-wrap gap-1 mt-1">
								{preferences?.characters?.protagonist?.traits?.map(
									(trait: string) => (
										<Badge key={trait} variant="outline" className="text-xs">
											{trait}
										</Badge>
									)
								)}
							</div>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">
								Love Interest:
							</span>
							<p className="font-medium">
								{preferences?.characters?.love_interest?.name}
							</p>
							<p className="text-sm text-muted-foreground">
								{preferences?.characters?.love_interest?.occupation}
							</p>
							<div className="flex flex-wrap gap-1 mt-1">
								{preferences?.characters?.love_interest?.traits?.map(
									(trait: string) => (
										<Badge key={trait} variant="outline" className="text-xs">
											{trait}
										</Badge>
									)
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Setting</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">
								Time Period:
							</span>
							<p className="font-medium">
								{getTimePeriodName(preferences?.setting?.time_period || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Location:</span>
							<p className="font-medium">{preferences?.setting?.location}</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Atmosphere:</span>
							<p className="font-medium">
								{getAtmosphereName(preferences?.setting?.atmosphere || "")}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Story Elements</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">Tropes:</span>
							<div className="flex flex-wrap gap-1 mt-1">
								{preferences?.elements?.tropes?.map((trope: string) => (
									<Badge key={trope} variant="secondary" className="text-xs">
										{trope}
									</Badge>
								))}
							</div>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Heat Level:</span>
							<p className="font-medium">
								{getHeatLevelName(preferences?.elements?.heat_level || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Length:</span>
							<p className="font-medium">
								{getStoryLengthName(preferences?.elements?.story_length || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Conflict:</span>
							<p className="font-medium">
								{getConflictTypeName(
									preferences?.elements?.conflict_type || ""
								)}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Approved Prompt Preview */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center">
						<FileText className="mr-2 h-5 w-5" />
						Approved Story Prompt
					</CardTitle>
					<CardDescription>
						This is the prompt that will be used to generate your story
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Textarea
						value={formattedPrompt}
						readOnly
						className="min-h-[200px] resize-none bg-muted/50"
					/>
					<div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
						<p>{formattedPrompt.length} characters</p>
						<p className="text-green-600 dark:text-green-400">
							✓ Approved and ready for generation
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="text-center pt-6">
				{isGuest ? (
					<div className="space-y-4">
						<div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
							<Crown className="h-8 w-8 text-primary mx-auto mb-3" />
							<h3 className="text-lg font-heading mb-2">Ready to Generate Your Story?</h3>
							<p className="text-muted-foreground text-sm mb-4">
								Create an account to generate your personalized romance story and save it to your library.
							</p>
							<Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
								<Link href="/auth/sign-up">
									<Crown className="mr-2 h-5 w-5" />
									Create Account to Generate Story
								</Link>
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Your story preferences have been saved and will be ready when you create your account.
						</p>
					</div>
				) : (
					<>
						<Button
							onClick={onGenerate}
							disabled={isGenerating}
							size="lg"
							className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
						>
							{isGenerating ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Crafting Your Story...
								</>
							) : (
								<>
									<Sparkles className="mr-2 h-5 w-5" />
									Generate My Story
								</>
							)}
						</Button>

						{isGenerating && (
							<p className="text-sm text-muted-foreground mt-4">
								Our AI is weaving your romantic tale... This may take a few moments.
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}
