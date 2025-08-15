"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard-header";
import { StoryGrid } from "@/components/story-grid";
import { CreateStoryButton } from "@/components/create-story-button";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import { useUserStories } from "@/hooks/use-user-stories";
import {
	Heart,
	BookOpen,
	Users,
	Crown,
	RefreshCw,
	AlertCircle,
	FileText,
} from "lucide-react";
import { BuyCreditsCta } from "@/components/buy-credits-cta";
import { useGuest } from "@/contexts/guest-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { DatabaseProfile } from "@/hooks/use-user-profile";

type StoryCardDetails = {
	id: string
	title: string
	genre: string 
	createdAt: string 
	excerpt: string 
	isPublic: boolean 
	characters: string[]
	isDemo: boolean
}

// Placeholder data for guests
const guestStories: StoryCardDetails[] = [
	// {
	// 	id: "demo-1",
	// 	title: "The Impact of Social Media on Modern Communication",
	// 	genre: "Research Paper",
	// 	createdAt: "2024-01-15",
	// 	excerpt:
	// 		"This comprehensive analysis examines how social media platforms have fundamentally transformed interpersonal communication patterns...",
	// 	isPublic: false,
	// 	characters: ["Social Media", "Communication Theory"],
	// 	isDemo: true,
	// },
	// {
	// 	id: "demo-2",
	// 	title: "Climate Change Effects on Global Agriculture",
	// 	genre: "Research Report",
	// 	createdAt: "2024-01-10",
	// 	excerpt:
	// 		"An in-depth study of how rising global temperatures and changing precipitation patterns are affecting crop yields worldwide...",
	// 	isPublic: true,
	// 	characters: ["Climate Data", "Agricultural Statistics"],
	// 	isDemo: true,
	// },
];

const guestSharedStories = [
	{
					id: "demo-3",
					title: "Artificial Intelligence in Healthcare: A Comprehensive Analysis",
					genre: "Academic Essay",
					author: "Dr. Emma Wilson",
					sharedAt: "2024-01-12",
					excerpt:
						"This paper explores the transformative potential of AI technologies in modern healthcare systems",
					characters: ["AI Technology", "Healthcare Innovation"],
		isDemo: true,
	},
];

export default function DashboardPage() {
	const { guestSession, isGuest } = useGuest();
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<DatabaseProfile | null>(null);
	const [loading, setLoading] = useState(true);

	// Get reading progress count for the stat card
	const { readingProgress } = useReadingProgress(user?.id);

	// Get user stories from database
	const {
		stories: userStories,
		loading: storiesLoading,
		error: storiesError,
		refetch: refetchStories,
	} = useUserStories(user?.id);

	useEffect(() => {
		async function loadUserData() {
			const supabase = createClient();

			// First, check for real authentication
			const { data, error } = await supabase.auth.getClaims();

			if (!error && data?.claims) {
				// User is authenticated, get user data
				const {
					data: { user: userData },
				} = await supabase.auth.getUser();

				if (userData) {
					const { data: profileData } = await supabase
						.from("profiles")
						.select("*")
						.eq("user_id", userData.id)
						.single();

					setUser(userData);
					setProfile(profileData);
					setLoading(false);
					return;
				}
			}

			// If no real authentication, check for guest mode
			if (isGuest) {
				setLoading(false);
				return;
			}

			// No auth and no guest session, redirect to login
			window.location.href = "/auth/login";
		}

		loadUserData();
	}, [isGuest]);

	if (loading) {
		return (
			<div className="min-h-screen bg-academic-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading your dashboard...</p>
				</div>
			</div>
		);
	}

	// Determine if we're in authenticated mode or guest mode
	const isAuthenticated = user && profile;

	// Use guest stories for guest mode, database stories for authenticated users
	const displayStories = isAuthenticated ? userStories : guestStories;

	const sharedStories = isAuthenticated
		? [
				{
					id: "demo-3",
					title: "Artificial Intelligence in Healthcare: A Comprehensive Analysis",
					genre: "Academic Essay",
					author: "Dr. Emma Wilson",
					sharedAt: "2024-01-12",
					excerpt:
						"This paper explores the transformative potential of AI technologies in modern healthcare systems",
					characters: ["AI Technology", "Healthcare Innovation"],
				},
		  ]
		: guestSharedStories;

	const creditsRemaining = isAuthenticated
		? profile?.credits_remaining || 0
		: guestSession?.user.creditsRemaining || 0;

	const displayName = isAuthenticated
		? profile?.display_name || "User"
		: guestSession?.user.displayName || "Guest User";

	return (
		<div className="min-h-screen bg-academic-gradient">
			<DashboardHeader />

			<main className="container mx-auto px-4 py-8">
				{!isAuthenticated && isGuest && (
					<Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Crown className="h-5 w-5 text-primary" />
								<CardTitle className="text-lg">
									Welcome, Guest User!
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								You&apos;re experiencing PaperAI in guest mode. Sign up to
								save your papers, get more credits, and unlock all features!
							</p>
							<div className="flex flex-col sm:flex-row gap-3">
								<Button asChild>
									<Link href="/auth/sign-up">
										<Crown className="mr-2 h-4 w-4" />
										Create Account
									</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="/auth/login">Sign In</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				<div className="mb-8">
					<h1 className="text-4xl font-heading text-foreground mb-2">
						Welcome back, {displayName}
					</h1>
					<p className="text-muted-foreground text-lg">
						Ready to generate your next academic paper?
					</p>
				</div>

				{!isAuthenticated && isGuest ? (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Crown className="h-5 w-5 text-primary" />
								Guest Trial Credit
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between mb-4">
								<div>
									<p className="text-3xl font-bold text-primary">
										{creditsRemaining} credit remaining
									</p>
									<p className="text-sm text-muted-foreground">
								Sign up to generate your first paper for free!
									</p>
								</div>
							</div>
							<Button asChild className="w-full">
								<Link href="/auth/sign-up">
									<Crown className="mr-2 h-4 w-4" />
									Sign Up for More Credits
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<BuyCreditsCta creditsRemaining={creditsRemaining} />
				)}

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
						<div className="flex items-center gap-3 mb-2">
							<FileText className="h-5 w-5 text-primary" />
							<h3 className="font-semibold">Your Papers</h3>
						</div>
						<p className="text-2xl font-heading text-primary">
							{isAuthenticated ? userStories.length : guestStories.length}
						</p>
						<p className="text-sm text-muted-foreground">Papers generated</p>
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
							Papers shared with you
						</p>
					</div>

					<div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
						<div className="flex items-center gap-3 mb-2">
							<BookOpen className="h-5 w-5 text-primary" />
							<h3 className="font-semibold">Reading</h3>
						</div>
						<p className="text-2xl font-heading text-primary">
							{isAuthenticated ? readingProgress.length : 0}
						</p>
						<p className="text-sm text-muted-foreground">Papers in progress</p>
					</div>
				</div>

				{/*
        // TODO: Add back in when we want to show the currently reading stories
        <div className="mb-12">
					<CurrentlyReading 
						userId={isAuthenticated ? user?.id : undefined} 
						isGuest={isGuest && !isAuthenticated}
					/>
				</div> */}

				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-heading">Your Papers</h2>
					<div className="flex items-center gap-2">
						{isAuthenticated && (
							<Button onClick={refetchStories} variant="ghost" size="sm">
								<RefreshCw className="h-4 w-4" />
							</Button>
						)}
						<CreateStoryButton />
					</div>
				</div>

				{/* Stories Loading State */}
				{isAuthenticated && storiesLoading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<Card key={i} className="bg-card/60 backdrop-blur-sm">
								<CardHeader className="pb-3">
									<div className="space-y-2">
										<div className="h-6 bg-muted rounded animate-pulse" />
										<div className="h-4 bg-muted rounded animate-pulse w-3/4" />
										<div className="flex gap-2">
											<div className="h-5 bg-muted rounded animate-pulse w-16" />
											<div className="h-5 bg-muted rounded animate-pulse w-20" />
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<div className="h-4 bg-muted rounded animate-pulse" />
										<div className="h-4 bg-muted rounded animate-pulse w-4/5" />
										<div className="h-4 bg-muted rounded animate-pulse w-3/5" />
									</div>
									<div className="h-8 bg-muted rounded animate-pulse" />
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Stories Error State */}
				{isAuthenticated && storiesError && (
					<Card className="bg-card/60 backdrop-blur-sm border-destructive/20">
						<CardHeader className="text-center">
							<CardTitle className="text-lg flex items-center justify-center gap-2 text-destructive">
								<AlertCircle className="h-5 w-5" />
								Error Loading Papers
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center space-y-4">
							<p className="text-sm text-muted-foreground">{storiesError}</p>
							<Button onClick={refetchStories} variant="outline" size="sm">
								<RefreshCw className="mr-2 h-4 w-4" />
								Try Again
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Stories Content */}
				{!storiesLoading && !storiesError && (
					<StoryGrid stories={displayStories} showAuthor={false} />
				)}

				{sharedStories.length > 0 && (
					<>
						<div className="flex items-center justify-between mb-6 mt-12">
							<h2 className="text-2xl font-heading">Papers Shared with You</h2>
						</div>
						<StoryGrid stories={sharedStories} showAuthor={true} />
					</>
				)}
			</main>
		</div>
	);
}
