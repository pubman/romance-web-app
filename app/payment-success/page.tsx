"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

function PaymentSuccessContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = searchParams?.get("session_id");
	
	const [profile, setProfile] = useState<{ credits_remaining: number; display_name: string | null } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!sessionId) {
			router.push("/pricing");
			return;
		}

		async function fetchUserData() {
			const supabase = createClient();
			
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();

			if (authError || !user) {
				router.push("/auth/login");
				return;
			}

			// Get updated profile with credits
			const { data: profileData } = await supabase
				.from("profiles")
				.select("credits_remaining, display_name")
				.eq("user_id", user.id)
				.single();

			setProfile(profileData);
			setLoading(false);

			// Trigger confetti celebration
			setTimeout(() => {
				confetti({
					particleCount: 100,
					spread: 70,
					origin: { y: 0.6 },
					colors: [
						"hsl(var(--primary))",
						"hsl(var(--accent))",
						"hsl(var(--secondary))",
					],
				});
			}, 500);
		}

		fetchUserData();
	}, [sessionId, router]);

	if (loading) {
		return (
			<div className="min-h-screen bg-romantic-gradient flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="flex items-center justify-center p-8">
						<Loader2 className="h-8 w-8 animate-spin" />
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-romantic-gradient flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center">
						<Check className="h-8 w-8 text-green-600 dark:text-green-400" />
					</div>
					<CardTitle className="text-2xl font-heading">
						Payment Successful!
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-6">
					<div className="p-4 bg-primary/10 rounded-lg">
						<div className="flex items-center justify-center gap-2 mb-2">
							<Sparkles className="h-5 w-5 text-primary" />
							<span className="font-semibold">Credits Added</span>
						</div>
						<p className="text-2xl font-bold text-primary">
							{profile?.credits_remaining || 0} credits
						</p>
						<p className="text-sm text-muted-foreground">
							Available in your account
						</p>
					</div>

					<p className="text-muted-foreground">
						Thank you for your purchase! Your credits have been added to your account and you can now create more amazing stories.
					</p>

					<div className="flex flex-col gap-3">
						<Button asChild className="w-full">
							<Link href="/create-story">
								<Sparkles className="mr-2 h-4 w-4" />
								Create Your Story
							</Link>
						</Button>
						<Button variant="outline" asChild className="w-full">
							<Link href="/dashboard">
								Return to Dashboard
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function PaymentSuccessPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-romantic-gradient flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="flex items-center justify-center p-8">
						<Loader2 className="h-8 w-8 animate-spin" />
					</CardContent>
				</Card>
			</div>
		}>
			<PaymentSuccessContent />
		</Suspense>
	);
}