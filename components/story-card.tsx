"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Heart,
	Share2,
	Eye,
	MoreHorizontal,
	Clock,
	AlertCircle,
	CheckCircle,
	Loader2,
	RefreshCw,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface StoryCardProps {
	story: DatabaseStory;
	showAuthor?: boolean;
}

export function StoryCard({ story, showAuthor = false }: StoryCardProps) {
	// Check if this is a demo/guest story
	const isGuestStory = story.id.startsWith("demo-");
	const storyRoute = isGuestStory ? `/guest-story/${story.id}` : `/story/${story.id}`;
	
	// Extract data from database schema
	const genre =
		story.story_preferences?.genre ||
		story.story_preferences?.elements?.genre ||
		"Romance";

	// Extract characters from wizard_data
	const characters: string[] = [];
	if (story.wizard_data?.characters?.protagonist?.name) {
		characters.push(story.wizard_data.characters.protagonist.name);
	}
	if (story.wizard_data?.characters?.love_interest?.name) {
		characters.push(story.wizard_data.characters.love_interest.name);
	}

	// Create excerpt from description
	const excerpt = story.description || "No description available.";
	const truncatedExcerpt =
		excerpt.length > 150 ? excerpt.substring(0, 150) + "..." : excerpt;

	// Format date
	const formattedDate = story.created_at
		? new Date(story.created_at).toLocaleDateString()
		: "";

	// Status styling and icons
	const getStatusConfig = (status: DatabaseStory["status"]) => {
		switch (status) {
			case "completed":
				return {
					icon: CheckCircle,
					color: "text-green-600",
					bgColor: "bg-green-100 dark:bg-green-900/20",
					label: "Completed",
				};
			case "generating":
				return {
					icon: Loader2,
					color: "text-blue-600",
					bgColor: "bg-blue-100 dark:bg-blue-900/20",
					label: "Generating",
				};
			case "draft":
				return {
					icon: Clock,
					color: "text-yellow-600",
					bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
					label: "Draft",
				};
			case "failed":
				return {
					icon: AlertCircle,
					color: "text-red-600",
					bgColor: "bg-red-100 dark:bg-red-900/20",
					label: "Failed",
				};
			default:
				return {
					icon: Clock,
					color: "text-gray-600",
					bgColor: "bg-gray-100 dark:bg-gray-900/20",
					label: status,
				};
		}
	};

	const statusConfig = getStatusConfig(story.status);
	const StatusIcon = statusConfig.icon;

	return (
		<Card className="group hover:shadow-lg transition-all duration-200 bg-card/60 backdrop-blur-sm border hover:border-primary/20">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-lg font-heading line-clamp-1 group-hover:text-primary transition-colors">
							{story.title}
						</CardTitle>
						{showAuthor && story.author && (
							<CardDescription className="text-sm mt-1">
								by {story.author}
							</CardDescription>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={storyRoute}>
									<Eye className="mr-2 h-4 w-4" />
									View Story
								</Link>
							</DropdownMenuItem>
							{!showAuthor && (
								<>
									<DropdownMenuItem>
										<Share2 className="mr-2 h-4 w-4" />
										Share
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Heart className="mr-2 h-4 w-4" />
										Edit Preferences
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex items-center gap-2 mt-2">
					<Badge variant="secondary" className="text-xs">
						{genre}
					</Badge>

					{/* Status badge */}
					<Badge
						variant="outline"
						className={`text-xs flex items-center gap-1 ${statusConfig.bgColor}`}
					>
						<StatusIcon
							className={`h-3 w-3 ${statusConfig.color} ${
								story.status === "generating" ? "animate-spin" : ""
							}`}
						/>
						{statusConfig.label}
					</Badge>

					{!showAuthor && story.is_public && (
						<Badge variant="outline" className="text-xs">
							Public
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="pt-0 space-y-4">
				<p className="text-sm text-muted-foreground line-clamp-3">
					{truncatedExcerpt}
				</p>

				{/* Generation Progress for generating stories */}
				{story.status === "generating" && (
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Generation Progress</span>
							<span className="font-medium">{story.generation_progress}%</span>
						</div>
						<Progress value={story.generation_progress} className="h-2" />
					</div>
				)}

				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<div className="flex items-center gap-2">
						{characters.length > 0 ? (
							<>
								<span>Characters:</span>
								<span className="font-medium">{characters.join(", ")}</span>
							</>
						) : (
							<span>No characters set</span>
						)}
					</div>
					{formattedDate && <span>Created {formattedDate}</span>}
				</div>

				{/* Word count if available */}
				{story.word_count > 0 && (
					<div className="text-xs text-muted-foreground">
						{story.word_count.toLocaleString()} words
					</div>
				)}

				<div className="mt-4">
					{story.status === "completed" ? (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
						>
							<Link href={storyRoute}>
								<Eye className="mr-2 h-4 w-4" />
								Read Story
							</Link>
						</Button>
					) : story.status === "generating" ? (
						<Button asChild variant="outline" size="sm" className="w-full">
							<Link href={`/story-status/${story.id}`}>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								View Progress
							</Link>
						</Button>
					) : story.status === "failed" ? (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="w-full hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20"
						>
							<Link href={`/story-retry/${story.id}`}>
								<RefreshCw className="mr-2 h-4 w-4" />
								Try Again
							</Link>
						</Button>
					) : (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
						>
							<Link href={storyRoute}>
								<Eye className="mr-2 h-4 w-4" />
								View Draft
							</Link>
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
