"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	ArrowLeft,
	Share2,
	Heart,
	BookOpen,
	Copy,
	Check,
	Users,
	Globe,
	Lock,
	FileIcon,
	AlertCircle,
	CheckCircle,
	Loader2,
	Star,
} from "lucide-react";
import Link from "next/link";
import { UserSearch } from "@/components/user-search";
import { DatabaseStory } from "@/hooks/use-user-stories";

export interface StoryDetailsProps {
	story: DatabaseStory;
}

interface SharedUser {
	user_id: string;
	display_name: string;
	avatar_url?: string;
}

export function StoryDetails({ story }: StoryDetailsProps) {
	const { toast } = useToast();
	const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);
	const [isCopied, setIsCopied] = useState(false);
	const [isPublic, setIsPublic] = useState(story.is_public);
	const [isSharing, setIsSharing] = useState(false);

	// Compute derived properties from DatabaseStory
	const characters: string[] = [];
	if (story.wizard_data?.characters?.protagonist?.name) {
		characters.push(story.wizard_data.characters.protagonist.name);
	}
	if (story.wizard_data?.characters?.love_interest?.name) {
		characters.push(story.wizard_data.characters.love_interest.name);
	}

	const genre = story.story_preferences?.elements?.genre || story.story_preferences?.genre || "Romance";
	const author = "You";
	const jobStatus = story.status === "completed" ? "completed" as const
		: story.status === "failed" ? "failed" as const
		: story.status === "generating" ? "processing" as const
		: "pending" as const;

	// PDF viewer state
	const [pdfError, setPdfError] = useState<string>("");

	// Rating system state
	const [showRatingModal, setShowRatingModal] = useState(false);
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [feedback, setFeedback] = useState("");
	const [isSubmittingRating, setIsSubmittingRating] = useState(false);
	const [ratingSubmitted, setRatingSubmitted] = useState(false);

	let shareUrl = "";
	if (typeof window !== "undefined") {
		shareUrl = `${window.location.origin}/story/${story.id}`;
	}

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleUserSelect = (user: SharedUser) => {
		setSelectedUsers((prev) => [...prev, user]);
	};

	const handleUserRemove = (userId: string) => {
		setSelectedUsers((prev) => prev.filter((user) => user.user_id !== userId));
	};

	const handleShareWithUsers = async () => {
		if (selectedUsers.length === 0) return;

		setIsSharing(true);
		try {
			const response = await fetch(`/api/stories/${story.id}/share`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userIds: selectedUsers.map((user) => user.user_id),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to share story");
			}

			// Clear selected users after successful share
			setSelectedUsers([]);

			console.log("Story shared successfully!", data);
			// You could show a success toast here with the message: data.message
		} catch (error) {
			console.error("Failed to share story:", error);
			// You could show an error toast here
		} finally {
			setIsSharing(false);
		}
	};

	const togglePublic = () => {
		// In a real app, this would update the database
		setIsPublic(!isPublic);
	};

	// PDF-related functions

	const submitRating = async () => {
		if (!story.generation_job_id || rating === 0) return;

		setIsSubmittingRating(true);

		try {
			const response = await fetch(`/api/stories/${story.id}/rate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					rating,
					feedback: feedback.trim() || null,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to submit rating");
			}

			setRatingSubmitted(true);

			toast({
				title: "Rating Submitted",
				description: "Thank you for your feedback!",
			});

			// Close modal after showing success
			setTimeout(() => {
				setShowRatingModal(false);
				setRating(0);
				setFeedback("");
				setRatingSubmitted(false);
			}, 2000);
		} catch (error) {
			console.error("Error submitting rating:", error);
			toast({
				title: "Failed to Submit Rating",
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				variant: "destructive",
			});
		} finally {
			setIsSubmittingRating(false);
		}
	};

	// Helper variables
	const isFailedOrModerated = jobStatus === "failed" || jobStatus === "moderated";
	const hasPdfCapability = Boolean(story.pdfUrl);
	const pdfUrl = story.pdfUrl;

	// Status configuration
	const statusConfig = {
		failed: {
			title: "Generation failed",
			description: "There was an issue generating your document",
			badge: {
				bg: "bg-red-50 dark:bg-red-900/20",
				text: "text-red-700 dark:text-red-400",
				icon: AlertCircle,
				label: "Failed",
			},
		},
		moderated: {
			title: "Generation moderated",
			description: "Your document was flagged during content review",
			badge: {
				bg: "bg-yellow-50 dark:bg-yellow-900/20",
				text: "text-yellow-700 dark:text-yellow-400",
				icon: AlertCircle,
				label: "Moderated",
			},
		},
		completed: {
			title: "Your story is ready!",
			description: "Access your document below",
			badge: {
				bg: "bg-green-50 dark:bg-green-900/20",
				text: "text-green-700 dark:text-green-400",
				icon: CheckCircle,
				label: "Complete",
			},
		},
		default: {
			title: story.title,
			description: `by ${author} • ${new Date(
				story.created_at
			).toLocaleDateString()}`,
			badge: null,
		},
	};

	const currentStatus = jobStatus === "failed"
			? statusConfig.failed
			: jobStatus === "moderated"
			? statusConfig.moderated
			: jobStatus === "completed"
			? statusConfig.completed
			: statusConfig.default;

	return (
		<div className="min-h-screen bg-romantic-gradient">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Dashboard
					</Link>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Story Content */}
					<div className="lg:col-span-3">
						<Card className="bg-card/80 backdrop-blur-sm">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<div className="flex items-center gap-3 mb-2">
											<CardTitle className="text-3xl font-heading">
												{currentStatus.title}
											</CardTitle>
											{currentStatus.badge && (
												<div
													className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${currentStatus.badge.bg} ${currentStatus.badge.text}`}
												>
													<currentStatus.badge.icon className="h-3 w-3" />
													{currentStatus.badge.label}
												</div>
											)}
										</div>
										<CardDescription className="text-base">
											{currentStatus.description}
										</CardDescription>
										<div className="flex items-center gap-2 mt-3">
											<Badge variant="secondary">{genre}</Badge>
											<Badge
												variant="outline"
												className="flex items-center gap-1"
											>
												{isPublic ? (
													<>
														<Globe className="h-3 w-3" />
														Public
													</>
												) : (
													<>
														<Lock className="h-3 w-3" />
														Private
													</>
												)}
											</Badge>
											{story.pageCount && (
												<Badge
													variant="outline"
													className="flex items-center gap-1"
												>
													<FileIcon className="h-3 w-3" />
													{story.pageCount}{" "}
													{story.pageCount === 1 ? "page" : "pages"}
												</Badge>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Dialog>
											<DialogTrigger asChild>
												<Button variant="outline" size="sm">
													<Share2 className="mr-2 h-4 w-4" />
													Share
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Share Your Story</DialogTitle>
													<DialogDescription>
														Share this romantic tale with friends or make it
														public for everyone to enjoy.
													</DialogDescription>
												</DialogHeader>

												<div className="space-y-4">
													<div className="flex items-center gap-2">
														<Button
															variant="outline"
															className="flex-1"
															onClick={handleCopyLink}
														>
															{isCopied ? (
																<>
																	<Check className="mr-2 h-4 w-4" />
																	Copied!
																</>
															) : (
																<>
																	<Copy className="mr-2 h-4 w-4" />
																	Copy Link
																</>
															)}
														</Button>

														<Button
															variant={isPublic ? "default" : "outline"}
															onClick={togglePublic}
														>
															{isPublic ? (
																<>
																	<Globe className="mr-2 h-4 w-4" />
																	Public
																</>
															) : (
																<>
																	<Lock className="mr-2 h-4 w-4" />
																	Make Public
																</>
															)}
														</Button>
													</div>

													<div className="space-y-4">
														<UserSearch
															onUserSelect={handleUserSelect}
															selectedUsers={selectedUsers}
															onUserRemove={handleUserRemove}
															maxSelections={5}
															placeholder="Search users by name..."
														/>

														{selectedUsers.length > 0 && (
															<Button
																onClick={handleShareWithUsers}
																disabled={isSharing}
																className="w-full"
															>
																<Users className="mr-2 h-4 w-4" />
																{isSharing
																	? "Sharing..."
																	: `Share with ${selectedUsers.length} user${
																			selectedUsers.length > 1 ? "s" : ""
																	  }`}
															</Button>
														)}
													</div>
												</div>
											</DialogContent>
										</Dialog>

										{/* Rating Modal Trigger */}
										{hasPdfCapability && pdfUrl && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowRatingModal(true)}
											>
												<Star className="mr-2 h-4 w-4" />
												Rate
											</Button>
										)}
									</div>
								</div>
							</CardHeader>

							<CardContent>
								<div className="min-h-[600px]">
									{isFailedOrModerated ? (
										<div className="flex flex-col items-center justify-center p-8 text-center">
											<AlertCircle
												className={`mb-4 h-12 w-12 ${
													story.jobStatus === "failed"
														? "text-red-500"
														: "text-yellow-500"
												}`}
											/>
											<h3 className="mb-2 text-lg font-medium">
												{story.jobStatus === "failed"
													? "PDF Generation Failed"
													: "PDF Generation Moderated"}
											</h3>
											<p className="mb-4 text-sm text-muted-foreground">
												{story.errorMessage ||
													"No additional error details available."}
											</p>
										</div>
									) : pdfError ? (
										<div className="flex flex-col items-center justify-center p-8 text-center">
											<AlertCircle className="mb-4 h-12 w-12 text-red-500" />
											<h3 className="mb-2 text-lg font-medium">
												Failed to Load PDF
											</h3>
											<p className="mb-4 text-sm text-muted-foreground">
												{pdfError}
											</p>
											<Button
												onClick={() => window.location.reload()}
												variant="outline"
												size="sm"
											>
												Try Again
											</Button>
										</div>
									) : pdfUrl ? (
										<div className="relative">
											<iframe
												src={pdfUrl}
												className="h-[600px] w-full rounded-lg border"
												title="Story PDF"
												onError={() => setPdfError("Failed to display PDF")}
											/>
										</div>
									) : (
										<div className="flex flex-col items-center justify-center p-8 text-center">
											<AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
											<h3 className="mb-2 text-lg font-medium">
												PDF Not Available
											</h3>
											<p className="mb-4 text-sm text-muted-foreground">
												{hasPdfCapability
													? "The PDF version is being generated or is not ready yet."
													: "PDF generation is not available for this story."}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						<Card className="bg-card/80 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<BookOpen className="h-5 w-5" />
									Story Details
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label className="text-sm text-muted-foreground">
										Characters
									</Label>
									<div className="flex flex-wrap gap-1 mt-1">
										{story.characters.map((character) => (
											<Badge
												key={character}
												variant="outline"
												className="text-xs"
											>
												{character}
											</Badge>
										))}
									</div>
								</div>

								<div>
									<Label className="text-sm text-muted-foreground">
										Setting
									</Label>
									<p className="text-sm font-medium">{story.wizard_data?.setting?.location || story.wizard_data?.setting?.atmosphere || "Unknown Location"}</p>
								</div>

								<div>
									<Label className="text-sm text-muted-foreground">
										Word Count
									</Label>
									<p className="text-sm font-medium">
										{story.content.split(" ").length.toLocaleString()} words
									</p>
								</div>
							</CardContent>
						</Card>

						{story.preferences && (
							<Card className="bg-card/80 backdrop-blur-sm">
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										<Heart className="h-5 w-5" />
										Romance Elements
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{story.preferences.elements?.tropes && (
										<div>
											<Label className="text-sm text-muted-foreground">
												Tropes
											</Label>
											<div className="flex flex-wrap gap-1 mt-1">
												{story.preferences.elements.tropes.map(
													(trope: string) => (
														<Badge
															key={trope}
															variant="secondary"
															className="text-xs"
														>
															{trope}
														</Badge>
													)
												)}
											</div>
										</div>
									)}

									{story.preferences.elements?.heat_level && (
										<div>
											<Label className="text-sm text-muted-foreground">
												Heat Level
											</Label>
											<p className="text-sm font-medium capitalize">
												{story.preferences.elements.heat_level}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						<div className="space-y-3">
							<Button className="w-full" variant="outline">
								<Heart className="mr-2 h-4 w-4" />
								Edit Preferences
							</Button>
							<Button className="w-full" variant="outline">
								Generate Similar Story
							</Button>
						</div>
					</div>
				</div>

				{/* Rating Modal */}
				<Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-xl">Rate Your Story PDF</DialogTitle>
							<DialogDescription>
								Help us improve by rating your generated PDF and sharing
								feedback.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6 py-4">
							{/* Star Rating */}
							<div className="flex justify-center space-x-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => setRating(star)}
										onMouseEnter={() => setHoveredRating(star)}
										onMouseLeave={() => setHoveredRating(0)}
										className="p-1 transition-colors"
									>
										<Star
											className={`h-8 w-8 transition-colors ${
												star <= (hoveredRating || rating)
													? "fill-yellow-400 text-yellow-400"
													: "text-muted-foreground"
											}`}
										/>
									</button>
								))}
							</div>

							{/* Optional Text Field */}
							<div className="space-y-2">
								<Label htmlFor="feedback" className="text-sm font-medium">
									Additional feedback (optional)
								</Label>
								<Textarea
									id="feedback"
									placeholder="Tell us what you think about your generated PDF..."
									value={feedback}
									onChange={(e) => setFeedback(e.target.value)}
									className="min-h-[100px] resize-none"
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								onClick={submitRating}
								disabled={rating === 0 || isSubmittingRating || ratingSubmitted}
								className="w-full"
							>
								{isSubmittingRating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Submitting...
									</>
								) : ratingSubmitted ? (
									<>
										<CheckCircle className="mr-2 h-4 w-4" />
										Thank you!
									</>
								) : (
									"Send Feedback"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
