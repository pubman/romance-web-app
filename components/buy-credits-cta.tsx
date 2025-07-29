import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles } from "lucide-react";
import Link from "next/link";

export async function BuyCreditsCta({
	creditsRemaining,
}: {
	creditsRemaining: number;
}) {
	return (
		<Link href="/pricing" className="block">
			<Card className="group relative overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				<CardHeader className="relative pb-3">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-primary/10 text-primary">
							<Coins className="h-5 w-5" />
						</div>
						<div className="flex-1">
							<CardTitle className="text-lg font-semibold text-foreground">
								Get More Credits
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Unlock unlimited storytelling
							</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="relative pt-0">
					<div className="flex items-center justify-between">
						<div className="text-4xl font-bold text-primary">
							{creditsRemaining} credits
						</div>
					</div>

					<div className="mt-4">
						<Button
							className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
							variant="outline"
						>
							<Coins className="h-4 w-4 mr-2" />
							Buy Credits Now
						</Button>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
