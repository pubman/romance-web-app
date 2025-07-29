import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2024-11-20.acacia",
});

export async function POST(request: NextRequest) {
	try {
		const { amount, credits, planName } = await request.json();

		if (!amount || !credits || !planName) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Get authenticated user
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user profile for metadata
		const { data: profile } = await supabase
			.from("profiles")
			.select("display_name")
			.eq("user_id", user.id)
			.single();

		// Create checkout session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: planName,
							description: `${credits} story credits for Romance by Me`,
						},
						unit_amount: amount * 100, // Convert to cents
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: `${request.nextUrl.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
			metadata: {
				user_id: user.id,
				credits: credits.toString(),
				plan_name: planName,
				user_email: user.email || "",
				user_name: profile?.display_name || "",
			},
		});

		return NextResponse.json({
			sessionId: session.id,
			url: session.url,
		});
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}