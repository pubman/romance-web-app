"use client";

import { useReadingProgress } from "@/hooks/use-reading-progress";
import { ReadingProgressCard } from "@/components/reading-progress-card";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BookOpen, RefreshCw, AlertCircle, Heart } from "lucide-react";
import Link from "next/link";

interface CurrentlyReadingProps {
	userId?: string;
	isGuest?: boolean;
}

export function CurrentlyReading({
	userId,
	isGuest = false,
}: CurrentlyReadingProps) {
	const { readingProgress, loading, error, refetch, isEmpty } =
		useReadingProgress(userId);

	// Guest state - show encouraging message
	if (isGuest) {
		return (
			<Card className="bg-card/60 backdrop-blur-sm border-dashed">
				<CardHeader className="text-center">
					<CardTitle className="text-lg flex items-center justify-center gap-2">
						<BookOpen className="h-5 w-5 text-primary" />
						Currently Reading
					</CardTitle>
					<CardDescription>
						Sign up to track your reading progress across stories
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<div className="space-y-4">
						<div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
							<Heart className="h-8 w-8 text-primary" />
						</div>
						<p className="text-sm text-muted-foreground">
							Keep track of your favorite romantic tales and pick up where you
							left off
						</p>
						<Button asChild>
							<Link href="/auth/sign-up">Create Account</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Loading state
	if (loading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-heading flex items-center gap-2">
						<BookOpen className="h-6 w-6 text-primary" />
						Currently Reading
					</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* Loading skeleton cards */}
					{[1, 2, 3].map((i) => (
						<Card key={i} className="bg-card/60 backdrop-blur-sm">
							<CardHeader className="pb-3">
								<div className="flex items-start gap-3">
									<div className="w-12 h-16 bg-muted rounded-md animate-pulse" />
									<div className="flex-1 space-y-2">
										<div className="h-5 bg-muted rounded animate-pulse" />
										<div className="h-4 bg-muted rounded animate-pulse w-3/4" />
										<div className="flex gap-2">
											<div className="h-5 bg-muted rounded animate-pulse w-16" />
											<div className="h-5 bg-muted rounded animate-pulse w-20" />
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex justify-between">
										<div className="h-4 bg-muted rounded animate-pulse w-16" />
										<div className="h-4 bg-muted rounded animate-pulse w-10" />
									</div>
									<div className="h-2 bg-muted rounded animate-pulse" />
								</div>
								<div className="h-8 bg-muted rounded animate-pulse" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<Card className="bg-card/60 backdrop-blur-sm border-destructive/20">
				<CardHeader className="text-center">
					<CardTitle className="text-lg flex items-center justify-center gap-2 text-destructive">
						<AlertCircle className="h-5 w-5" />
						Error Loading Reading Progress
					</CardTitle>
					<CardDescription>
						We couldn&apos;t load your currently reading stories
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-sm text-muted-foreground">{error}</p>
					<Button onClick={refetch} variant="outline" size="sm">
						<RefreshCw className="mr-2 h-4 w-4" />
						Try Again
					</Button>
				</CardContent>
			</Card>
		);
	}

	// Empty state
	if (isEmpty) {
		return (
			<Card className="bg-card/60 backdrop-blur-sm border-dashed">
				<CardHeader className="text-center">
					<CardTitle className="text-lg flex items-center justify-center gap-2">
						<BookOpen className="h-5 w-5 text-primary" />
						Currently Reading
					</CardTitle>
					<CardDescription>No stories in progress yet</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<div className="space-y-4">
						<div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
							<BookOpen className="h-8 w-8 text-primary" />
						</div>
						<p className="text-sm text-muted-foreground">
							Create your first romantic story and start reading to see your
							progress here
						</p>
						<Button asChild>
							<Link href="/create-story">
								<Heart className="mr-2 h-4 w-4" />
								Create Your First Story
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Content state - show reading progress
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-heading flex items-center gap-2">
					<BookOpen className="h-6 w-6 text-primary" />
					Currently Reading
				</h2>
				<Button onClick={refetch} variant="ghost" size="sm">
					<RefreshCw className="h-4 w-4" />
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{readingProgress.map((progress) => (
					<ReadingProgressCard key={progress.story_id} progress={progress} />
				))}
			</div>

			{readingProgress.length >= 6 && (
				<div className="text-center">
					<Button variant="outline" asChild>
						<Link href="/dashboard/reading">View All Reading Progress</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
