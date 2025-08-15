"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GuestStoryDetails } from "@/components/guest-story-details";

// Demo papers data - matches the guestSharedStories in dashboard
const demoPapers = {
  "demo-3": {
    id: "demo-3",
    title: "Singapore's Technological Innovation Trajectory: 2025-2030 Strategic Positioning",
    genre: "Research Paper",
    author: "Dr. Sarah Chen", 
    sharedAt: "2024-01-12",
    description: "A comprehensive analysis of Singapore's strategic positioning in technological innovation for the next five years",
    characters: ["Technological Innovation", "Strategic Positioning", "Singapore", "Technology Policy"],
    isDemo: true,
    contentUrl: "/Example_Paper.pdf", // Path to our static PDF content
    status: "completed" as const,
    word_count: 8000,
    chapter_count: 25, // Using as page_count for academic papers
  }
};


type DemoPaper = {
  id: string;
  title: string;
  genre: string;
  author: string;
  sharedAt: string;
  description: string;
  characters: string[];
  isDemo: boolean;
  contentUrl: string;
  status: "completed";
  word_count: number;
  chapter_count: number;
};

export default function GuestPaperPage() {
  const params = useParams();
  const id = params?.id as string;
  const [paper, setPaper] = useState<DemoPaper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and fetch demo paper
    const timer = setTimeout(() => {
      const foundPaper = demoPapers[id as keyof typeof demoPapers];
      setPaper(foundPaper || null);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-academic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-academic-gradient flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-heading mb-4">Paper Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The paper you&apos;re looking for doesn&apos;t exist or is no longer available.
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

  return <GuestStoryDetails story={paper} />;
}
