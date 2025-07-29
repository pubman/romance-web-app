import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function BuyCreditsCta() {
	return (
		<Link href="/pricing">
			<Card>
				<CardHeader>
					<CardTitle>Buy Credits</CardTitle>
				</CardHeader>
				<CardContent>
					<p>Buy credits to get started</p>
				</CardContent>
			</Card>
		</Link>
	);
}
