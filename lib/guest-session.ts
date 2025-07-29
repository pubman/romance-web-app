"use client";

export interface GuestUser {
	id: string;
	displayName: string;
	email: string;
	creditsRemaining: number;
	createdAt: string;
}

export interface GuestSession {
	user: GuestUser;
	isGuest: true;
	expiresAt: string;
}

const GUEST_SESSION_KEY = "romance_guest_session";
const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function createGuestSession(): GuestSession {
	const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	const now = new Date();
	const expiresAt = new Date(now.getTime() + GUEST_SESSION_DURATION);

	const session: GuestSession = {
		user: {
			id: guestId,
			displayName: "Guest Writer",
			email: "guest@example.com",
			creditsRemaining: 1, // One free trial credit
			createdAt: now.toISOString(),
		},
		isGuest: true,
		expiresAt: expiresAt.toISOString(),
	};

	// Store in localStorage and set cookie for middleware
	if (typeof window !== "undefined") {
		localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
		
		// Set cookie for middleware detection
		document.cookie = `guest_session=${guestId}; path=/; max-age=${GUEST_SESSION_DURATION / 1000}; SameSite=Lax`;
	}

	return session;
}

export function getGuestSession(): GuestSession | null {
	if (typeof window === "undefined") return null;

	try {
		const stored = localStorage.getItem(GUEST_SESSION_KEY);
		if (!stored) return null;

		const session: GuestSession = JSON.parse(stored);

		// Check if session has expired
		if (new Date() > new Date(session.expiresAt)) {
			clearGuestSession();
			return null;
		}

		return session;
	} catch (error) {
		console.error("Error reading guest session:", error);
		clearGuestSession();
		return null;
	}
}

export function clearGuestSession(): void {
	if (typeof window !== "undefined") {
		localStorage.removeItem(GUEST_SESSION_KEY);
		// Clear the cookie
		document.cookie = "guest_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
	}
}

export function updateGuestCredits(creditsUsed: number): void {
	const session = getGuestSession();
	if (!session) return;

	session.user.creditsRemaining = Math.max(0, session.user.creditsRemaining - creditsUsed);
	
	if (typeof window !== "undefined") {
		localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
	}
}

export function isGuestSession(): boolean {
	return getGuestSession() !== null;
}