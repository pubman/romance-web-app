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
} from "lucide-react";
import { BuyCreditsCta } from "@/components/buy-credits-cta";
import { useGuest } from "@/contexts/guest-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { DatabaseProfile } from "@/hooks/use-user-profile";

// Placeholder data for guests
const guestStories = [
	// {
	// 	id: "demo-1",
	// 	title: "Love in the Vineyard",
	// 	genre: "Contemporary",
	// 	createdAt: "2024-01-15",
	// 	excerpt:
	// 		"Sarah never expected to find love while managing her family's struggling vineyard...",
	// 	isPublic: false,
	// 	characters: ["Sarah", "Marco"],
	// 	isDemo: true,
	// },
	// {
	// 	id: "demo-2",
	// 	title: "The Duke's Secret",
	// 	genre: "Historical",
	// 	createdAt: "2024-01-10",
	// 	excerpt:
	// 		"In Regency London, Lady Catherine discovers that the mysterious Duke harbors a secret that could change everything...",
	// 	isPublic: true,
	// 	characters: ["Lady Catherine", "Duke Alexander"],
	// 	isDemo: true,
	// },
];

const guestSharedStories = [
	{
					id: "3",
					title: "Blueprint for a Kisses",
					genre: "Contemporary",
					author: "Emma Wilson",
					sharedAt: "2024-01-12",
					excerpt:
						"A chance encounter for architect Emma leads to a deeper romance",
					characters: ["Emma", "James"],
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
			<div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
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
					id: "3",
					title: "Blueprint for a Kisses",
					genre: "Contemporary",
					author: "Emma Wilson",
					sharedAt: "2024-01-12",
					excerpt:
						"A chance encounter for architect Emma leads to a deeper romance",
					characters: ["Emma", "James"],
				},
		  ]
		: guestSharedStories;

	const creditsRemaining = isAuthenticated
		? profile?.credits_remaining || 0
		: guestSession?.user.creditsRemaining || 0;

	const displayName = isAuthenticated
		? profile?.display_name || "Writer"
		: guestSession?.user.displayName || "Guest Writer";

	return (
		<div className="min-h-screen bg-romantic-gradient">
			<DashboardHeader />

			<main className="container mx-auto px-4 py-8">
				{!isAuthenticated && isGuest && (
					<Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Crown className="h-5 w-5 text-primary" />
								<CardTitle className="text-lg">
									Welcome, Guest Writer!
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								You&apos;re experiencing Romance by Me in guest mode. Sign up to
								save your stories, get more credits, and unlock all features!
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
						Ready to craft your next romantic tale?
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
										Try creating your first story for free!
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
							<Heart className="h-5 w-5 text-primary" />
							<h3 className="font-semibold">Your Stories</h3>
						</div>
						<p className="text-2xl font-heading text-primary">
							{isAuthenticated ? userStories.length : guestStories.length}
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
						<p className="text-2xl font-heading text-primary">
							{isAuthenticated ? readingProgress.length : 0}
						</p>
						<p className="text-sm text-muted-foreground">Stories in progress</p>
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
					<h2 className="text-2xl font-heading">Your Stories</h2>
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
								Error Loading Stories
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
							<h2 className="text-2xl font-heading">Shared with You</h2>
						</div>
						<StoryGrid stories={sharedStories} showAuthor={true} />
					</>
				)}
			</main>
		</div>
	);
}
