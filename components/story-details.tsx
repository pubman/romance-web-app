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
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
	Download,
	Copy,
	Check,
	Users,
	Globe,
	Lock,
	FileText,
	FileIcon,
	AlertCircle,
	CheckCircle,
	Loader2,
	ChevronDown,
	ChevronUp,
	Star,
	Eye,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { UserSearch } from "@/components/user-search";

interface StoryDetailsProps {
	story: {
		id: string;
		title: string;
		genre: string;
		author: string;
		createdAt: string;
		isPublic: boolean;
		characters: string[];
		setting: string;
		content: string;
		preferences?: unknown;
		// PDF-related properties
		pdfUrl?: string;
		jobId?: string;
		generatedAt?: string;
		pageCount?: number;
		jobStatus?: "pending" | "processing" | "completed" | "failed" | "moderated";
		errorMessage?: string;
	};
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
	const [isPublic, setIsPublic] = useState(story.isPublic);
	const [isSharing, setIsSharing] = useState(false);

	// PDF viewer state
	const [viewMode, setViewMode] = useState<"text" | "pdf">("text");
	const [isLoadingPdf, setIsLoadingPdf] = useState(false);
	const [pdfError, setPdfError] = useState<string>("");
	const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

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

	const downloadStory = () => {
		const element = document.createElement("a");
		const file = new Blob([story.content], { type: "text/plain" });
		element.href = URL.createObjectURL(file);
		element.download = `${story.title}.txt`;
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	// PDF-related functions
	const loadPdf = async () => {
		if (!story.jobId) {
			setPdfError("No PDF generation job available");
			return;
		}

		setIsLoadingPdf(true);
		setPdfError("");

		try {
			// Check if PDF is ready
			const response = await fetch(`/api/stories/${story.id}/pdf-status`);
			if (!response.ok) {
				throw new Error("Failed to check PDF status");
			}

			const data = await response.json();
			if (data.status === "completed" && data.pdfUrl) {
				// PDF is ready, switch to PDF view
				setViewMode("pdf");
			} else if (data.status === "failed") {
				throw new Error(data.error || "PDF generation failed");
			} else {
				throw new Error("PDF is not ready yet");
			}
		} catch (error) {
			console.error("Error loading PDF:", error);
			setPdfError(
				error instanceof Error ? error.message : "Failed to load PDF"
			);
		} finally {
			setIsLoadingPdf(false);
		}
	};

	const downloadPdf = async () => {
		if (!story.jobId) {
			toast({
				title: "Download Failed",
				description: "No PDF available for download",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await fetch(`/api/stories/${story.id}/download-pdf`);
			if (!response.ok) {
				throw new Error("Failed to download PDF");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${story.title}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast({
				title: "Download Started",
				description: "Your PDF is being downloaded",
			});
		} catch (error) {
			console.error("Error downloading PDF:", error);
			toast({
				title: "Download Failed",
				description:
					error instanceof Error ? error.message : "Failed to download PDF",
				variant: "destructive",
			});
		}
	};

	const submitRating = async () => {
		if (!story.jobId || rating === 0) return;

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
	console.log(story);
	const isFailedOrModerated =
		story.jobStatus === "failed" || story.jobStatus === "moderated";
	const hasPdfCapability = Boolean(story.pdfUrl);
	const pdfUrl =
		story.pdfUrl ||
		(story.jobId ? `/api/stories/${story.id}/preview-pdf` : null);

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
			description: `by ${story.author} • ${new Date(
				story.createdAt
			).toLocaleDateString()}`,
			badge: null,
		},
	};

	const currentStatus =
		story.jobStatus === "failed"
			? statusConfig.failed
			: story.jobStatus === "moderated"
			? statusConfig.moderated
			: story.jobStatus === "completed"
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
											<Badge variant="secondary">{story.genre}</Badge>
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
										{hasPdfCapability && (
											<>
												<div className="flex items-center rounded-lg border border-input bg-background">
													<Button
														variant={viewMode === "text" ? "default" : "ghost"}
														size="sm"
														onClick={() => setViewMode("text")}
														className="rounded-r-none"
													>
														<FileText className="mr-2 h-4 w-4" />
														Text
													</Button>
													<Button
														variant={viewMode === "pdf" ? "default" : "ghost"}
														size="sm"
														onClick={() => {
															if (pdfUrl) {
																setViewMode("pdf");
															} else {
																loadPdf();
															}
														}}
														className="rounded-l-none"
														disabled={isLoadingPdf}
													>
														{isLoadingPdf ? (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														) : (
															<Eye className="mr-2 h-4 w-4" />
														)}
														PDF
													</Button>
												</div>

												<Button
													variant="outline"
													size="sm"
													onClick={downloadPdf}
												>
													<Download className="mr-2 h-4 w-4" />
													PDF
												</Button>
											</>
										)}

										<Button variant="outline" size="sm" onClick={downloadStory}>
											<Download className="mr-2 h-4 w-4" />
											Text
										</Button>

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
								{viewMode === "text" ? (
									<div className="prose prose-lg max-w-none dark:prose-invert">
										<ReactMarkdown>{story.content}</ReactMarkdown>
									</div>
								) : viewMode === "pdf" ? (
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
												<Button
													onClick={() => setViewMode("text")}
													variant="outline"
													size="sm"
												>
													View Text Version
												</Button>
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
												<div className="flex gap-2">
													<Button onClick={loadPdf} variant="outline" size="sm">
														Try Again
													</Button>
													<Button
														onClick={() => setViewMode("text")}
														variant="outline"
														size="sm"
													>
														View Text Version
													</Button>
												</div>
											</div>
										) : isLoadingPdf ? (
											<div className="flex flex-col items-center justify-center p-8 text-center">
												<Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
												<h3 className="mb-2 text-lg font-medium">
													Loading PDF
												</h3>
												<p className="text-sm text-muted-foreground">
													Please wait while we prepare your document...
												</p>
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
												<FileText className="mb-4 h-12 w-12 text-muted-foreground" />
												<h3 className="mb-2 text-lg font-medium">
													PDF Not Available
												</h3>
												<p className="mb-4 text-sm text-muted-foreground">
													{hasPdfCapability
														? "The PDF version is being generated or is not ready yet."
														: "PDF generation is not available for this story."}
												</p>
												<Button
													onClick={() => setViewMode("text")}
													variant="outline"
													size="sm"
												>
													View Text Version
												</Button>
											</div>
										)}
									</div>
								) : null}
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
									<p className="text-sm font-medium">{story.setting}</p>
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

						{/* Enhanced Download Options */}
						{hasPdfCapability && (
							<Card className="bg-card/80 backdrop-blur-sm">
								<Collapsible
									open={isDownloadOptionsOpen}
									onOpenChange={setIsDownloadOptionsOpen}
								>
									<CollapsibleTrigger asChild>
										<div className="flex cursor-pointer items-center justify-between rounded-t-lg p-4 hover:bg-muted/50">
											<h3 className="text-base font-medium">
												Additional Download Options
											</h3>
											{isDownloadOptionsOpen ? (
												<ChevronUp className="h-4 w-4" />
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
										</div>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<CardContent className="space-y-3 pt-0">
											<div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
												<div className="flex items-center gap-2">
													<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
														<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
													</div>
													<div>
														<h4 className="text-sm font-medium">
															Enhanced PDF
														</h4>
														<p className="text-xs text-muted-foreground">
															Professional formatted version
														</p>
													</div>
												</div>
												<Button
													onClick={downloadPdf}
													disabled={!pdfUrl}
													size="sm"
													variant="outline"
												>
													Download
												</Button>
											</div>

											<div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
												<div className="flex items-center gap-2">
													<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
														<FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
													</div>
													<div>
														<h4 className="text-sm font-medium">Plain Text</h4>
														<p className="text-xs text-muted-foreground">
															Simple text file format
														</p>
													</div>
												</div>
												<Button
													onClick={downloadStory}
													size="sm"
													variant="outline"
												>
													Download
												</Button>
											</div>

											{hasPdfCapability && pdfUrl && (
												<div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
													<div className="flex items-center gap-2">
														<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
															<Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
														</div>
														<div>
															<h4 className="text-sm font-medium">
																Rate & Feedback
															</h4>
															<p className="text-xs text-muted-foreground">
																Share your thoughts on the PDF
															</p>
														</div>
													</div>
													<Button
														onClick={() => setShowRatingModal(true)}
														size="sm"
														variant="outline"
													>
														Rate
													</Button>
												</div>
											)}
										</CardContent>
									</CollapsibleContent>
								</Collapsible>
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
