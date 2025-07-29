"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StoryWizard } from "@/components/story-wizard";
import { useGuest } from "@/contexts/guest-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CreateStoryPage() {
  const { guestSession, isGuest, canUseCredits } = useGuest();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (isGuest) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.getClaims();
      
      if (error || !data?.claims) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: { user: userData } } = await supabase.auth.getUser();
      
      if (!userData) {
        window.location.href = "/auth/login";
        return;
      }

      setUser(userData);
      setLoading(false);
    }

    loadUserData();
  }, [isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading story wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        {isGuest && (
          <div className="mb-6 space-y-4">
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Guest Story Creation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You&apos;re creating a story as a guest. You have {guestSession?.user.creditsRemaining || 0} free credit remaining.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild>
                    <Link href="/auth/sign-up">
                      <Crown className="mr-2 h-4 w-4" />
                      Sign Up to Save Stories
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {!canUseCredits && (
              <Card className="border-2 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <CardHeader>
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="h-5 w-5" />
                    <CardTitle className="text-lg">No Credits Remaining</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                    You&apos;ve used your free guest credit. Sign up to get more credits and continue creating stories!
                  </p>
                  <Button asChild>
                    <Link href="/auth/sign-up">
                      <Crown className="mr-2 h-4 w-4" />
                      Create Account for More Credits
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <StoryWizard />
      </div>
    </div>
  );
}