"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Crown, 
  BookOpen, 
  User, 
  Calendar, 
  FileText,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface GuestStoryDetailsProps {
  story: {
    id: string;
    title: string;
    genre: string;
    author: string;
    description: string;
    characters: string[];
    contentUrl: string;
    status: string;
    word_count: number;
    chapter_count: number;
    sharedAt?: string;
  };
}

export function GuestStoryDetails({ story }: GuestStoryDetailsProps) {
  const [pdfError, setPdfError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for PDF
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-academic-gradient">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Guest Notice */}
        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Demo Story - Guest Preview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You&apos;re viewing a demo story. Create an account to generate unlimited personalized romantic stories and save them to your library!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href="/auth/sign-up">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Account - Get Started
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Story Header */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-heading mb-2">
                  {story.title}
                </CardTitle>
                <CardDescription className="text-lg">
                  {story.description}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <Badge variant="secondary">{story.genre}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>by {story.author}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{story.word_count.toLocaleString()} words</span>
              </div>
              {story.sharedAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Shared {new Date(story.sharedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {story.characters.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-muted-foreground mr-2">Characters:</span>
                {story.characters.map((character, index) => (
                  <Badge key={index} variant="outline" className="mr-1">
                    {character}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Story Content */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Story PDF
            </CardTitle>
            <CardDescription>
              Enjoy this sample romance story. Create your account to generate your own personalized stories!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 min-h-[600px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your story PDF...</p>
                  </div>
                </div>
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[600px]">
                  <FileText className="mb-4 h-12 w-12 text-red-500" />
                  <h3 className="mb-2 text-lg font-medium">Failed to Load PDF</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{pdfError}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <iframe
                    src={story.contentUrl}
                    className="h-[600px] w-full rounded-lg border"
                    title="Sample Romance Story PDF"
                    onError={() => setPdfError("Failed to display PDF")}
                  />
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Sample Romance Story</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {story.word_count.toLocaleString()} words
                        </span>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                        >
                          <a
                            href={story.contentUrl}
                            download="Emma's Romance.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download PDF
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action Footer */}
        <Card className="mt-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Ready to Create Your Own Story?
            </CardTitle>
            <CardDescription className="text-base">
              This was just a sample of what Romance by Me can create. Join thousands of writers crafting their perfect romantic tales.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Writing Your Story
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/create-story">
                  Try the Story Wizard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}