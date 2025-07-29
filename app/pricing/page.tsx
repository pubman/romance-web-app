import { Pricing } from "@/components/pricing";

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
	},
];

export default function PricingPage() {
	return (
		<div className="h-[800px] overflow-y-auto rounded-lg">
			<Pricing
				plans={demoPlans}
				title="Start Writing Your Story"
				description="Buy credits to get started with your first story, or buy a bundle to explore all your desires."
				showSwitch={false}
			/>
		</div>
	);
}
