import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-06-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
	const body = await request.text();
	const signature = request.headers.get("stripe-signature");

	if (!signature) {
		return NextResponse.json(
			{ error: "Missing stripe-signature header" },
			{ status: 400 }
		);
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (error) {
		console.error("Webhook signature verification failed:", error);
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 400 }
		);
	}

	try {
		if (event.type === "payment_intent.succeeded") {
			const paymentIntent = event.data.object as Stripe.PaymentIntent;
			
			const {
				user_id,
				credits,
				plan_name,
			} = paymentIntent.metadata;

			if (!user_id || !credits || !plan_name) {
				console.error("Missing metadata in payment intent:", paymentIntent.id);
				return NextResponse.json(
					{ error: "Missing metadata" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Start a transaction by creating the purchase record first
			const { error: purchaseError } = await supabase
				.from("purchases")
				.insert({
					user_id,
					stripe_payment_intent_id: paymentIntent.id,
					product_name: plan_name,
					amount: paymentIntent.amount,
					currency: paymentIntent.currency,
					status: "completed",
				});

			if (purchaseError) {
				console.error("Error creating purchase record:", purchaseError);
				return NextResponse.json(
					{ error: "Failed to create purchase record" },
					{ status: 500 }
				);
			}

			// Update user credits by incrementing the existing amount
			const { data: currentProfile, error: fetchError } = await supabase
				.from("profiles")
				.select("credits_remaining, credits_used")
				.eq("user_id", user_id)
				.single();

			if (fetchError) {
				console.error("Error fetching current credits:", fetchError);
				return NextResponse.json(
					{ error: "Failed to fetch current credits" },
					{ status: 500 }
				);
			}

			const newCredits = (currentProfile.credits_remaining || 0) + parseInt(credits);

			const { error: creditError } = await supabase
				.from("profiles")
				.update({
					credits_remaining: newCredits,
				})
				.eq("user_id", user_id);

			if (creditError) {
				console.error("Error adding credits:", creditError);
				return NextResponse.json(
					{ error: "Failed to add credits" },
					{ status: 500 }
				);
			}

			console.log(`Successfully processed payment for user ${user_id}: ${credits} credits added`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}