"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
	GuestSession,
	createGuestSession,
	getGuestSession,
	clearGuestSession,
	updateGuestCredits,
} from "@/lib/guest-session";
import { createClient } from "@/lib/supabase/client";

interface GuestContextType {
	guestSession: GuestSession | null;
	isGuest: boolean;
	startGuestSession: () => void;
	endGuestSession: () => void;
	useGuestCredit: () => void;
	canUseCredits: boolean;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: React.ReactNode }) {
	const [guestSession, setGuestSession] = useState<GuestSession | null>(null);

	useEffect(() => {
		// Check for existing guest session on mount
		const existingSession = getGuestSession();
		if (existingSession) {
			setGuestSession(existingSession);
		}
	}, []); // Only run on mount

	useEffect(() => {
		const supabase = createClient();

		// Listen for auth state changes to clear guest session when user signs in
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				if (session?.user) {
					// User has signed in, clear any guest session
					const currentGuestSession = getGuestSession();
					if (currentGuestSession) {
						clearGuestSession();
						setGuestSession(null);
					}
				}
			}
		);

		return () => subscription.unsubscribe();
	}, []); // Only set up listener once

	const startGuestSession = () => {
		const session = createGuestSession();
		setGuestSession(session);
	};

	const endGuestSession = () => {
		clearGuestSession();
		setGuestSession(null);
	};

	const useGuestCredit = () => {
		if (guestSession && guestSession.user.creditsRemaining > 0) {
			updateGuestCredits(1);
			// Update local state
			const updatedSession = {
				...guestSession,
				user: {
					...guestSession.user,
					creditsRemaining: guestSession.user.creditsRemaining - 1,
				},
			};
			setGuestSession(updatedSession);
		}
	};

	const contextValue: GuestContextType = {
		guestSession,
		isGuest: guestSession !== null,
		startGuestSession,
		endGuestSession,
		useGuestCredit,
		canUseCredits: guestSession ? guestSession.user.creditsRemaining > 0 : false,
	};

	return (
		<GuestContext.Provider value={contextValue}>
			{children}
		</GuestContext.Provider>
	);
}

export function useGuest() {
	const context = useContext(GuestContext);
	if (context === undefined) {
		throw new Error("useGuest must be used within a GuestProvider");
	}
	return context;
}