"use client";

import { Pricing } from "@/components/pricing";
import { DashboardHeader } from "@/components/dashboard-header";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const demoPlans = [
	{
		name: "SINGLE",
		price: "10",
		yearlyPrice: "40",
		features: ["1 story credit"],
		description: "Perfect for one-off stories",
		buttonText: "Buy Credit",
		href: "/pricing",
		isPopular: false,
		credits: 1,
	},
	{
		name: "SMALL BUNDLE",
		price: "25",
		yearlyPrice: "160",
		features: ["3 story credits"],
		description: "Ideal for exploring multiple genres",
		buttonText: "Buy Bundle",
		href: "/pricing",
		isPopular: true,
		credits: 3,
	},
	{
		name: "LARGE BUNDLE",
		price: "80",
		yearlyPrice: "320",
		features: ["10 story credits"],
		description: "For any fantasy you can imagine",
		buttonText: "Buy Bundle",
		href: "/pricing",
		isPopular: false,
		credits: 10,
	},
];

function PricingContent() {
	const searchParams = useSearchParams();
	const canceled = searchParams?.get("canceled");

	useEffect(() => {
		if (canceled) {
			// Could show a toast or notification here
			console.log("Payment was canceled");
		}
	}, [canceled]);

	return (
		<div className="h-[800px] overflow-y-auto rounded-lg">
			<DashboardHeader />
			{canceled && (
				<div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<p className="text-yellow-800 dark:text-yellow-200 text-center">
						Payment was canceled. You can try again anytime!
					</p>
				</div>
			)}
			<Pricing
				plans={demoPlans}
				title="Start Writing Your Story"
				description="Buy credits to get started with your first story, or buy a bundle to explore all your desires."
				showSwitch={false}
			/>
		</div>
	);
}

export default function PricingPage() {
	return (
		<Suspense fallback={
			<div className="h-[800px] overflow-y-auto rounded-lg">
				<DashboardHeader />
				<div className="flex items-center justify-center p-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</div>
		}>
			<PricingContent />
		</Suspense>
	);
}
