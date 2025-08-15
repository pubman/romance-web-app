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
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(story.contentUrl);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error("Failed to load story content:", error);
        setContent("Failed to load story content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [story.contentUrl]);

  return (
    <div className="min-h-screen bg-romantic-gradient">
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
              You're viewing a demo story. Create an account to generate unlimited personalized romantic stories and save them to your library!
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
              Story Content
            </CardTitle>
            <CardDescription>
              Enjoy this sample romance story. Create your account to generate your own personalized stories!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading story...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="bg-muted/30 p-6 rounded-lg font-serif leading-relaxed whitespace-pre-line">
                  {content}
                </div>
              </div>
            )}
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