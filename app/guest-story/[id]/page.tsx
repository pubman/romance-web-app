"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GuestStoryDetails } from "@/components/guest-story-details";

// Demo stories data - matches the guestSharedStories in dashboard
const demoStories = {
  "demo-3": {
    id: "demo-3",
    title: "Midnight in Paris",
    genre: "Contemporary",
    author: "Emma Wilson", 
    sharedAt: "2024-01-12",
    description: "A chance encounter at the Eiffel Tower leads to an unexpected romance between Sophie, an American literature professor, and Jean-Luc, a charming Parisian architect. Their love story unfolds against the magical backdrop of the City of Light.",
    characters: ["Sophie", "Jean-Luc"],
    isDemo: true,
    contentUrl: "/Emma's Romance.pdf", // Path to our static PDF content
    status: "completed" as const,
    word_count: 2500,
    chapter_count: 3,
  }
};

interface GuestStoryPageProps {
  params: { id: string };
}

export default function GuestStoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and fetch demo story
    const timer = setTimeout(() => {
      const foundStory = demoStories[id as keyof typeof demoStories];
      setStory(foundStory || null);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-heading mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The story you're looking for doesn't exist or is no longer available.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <GuestStoryDetails story={story} />;
}