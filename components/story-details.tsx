"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  BookOpen, 
  Download, 
  Copy,
  Check,
  Users,
  Globe,
  Lock
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { UserSearch } from "@/components/user-search";

interface StoryDetailsProps {
  story: {
    id: string;
    title: string;
    genre: string;
    author: string;
    createdAt: string;
    isPublic: boolean;
    characters: string[];
    setting: string;
    content: string;
    preferences?: any;
  };
}

interface SharedUser {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

export function StoryDetails({ story }: StoryDetailsProps) {
  const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(story.isPublic);
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = `${window.location.origin}/story/${story.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleUserSelect = (user: SharedUser) => {
    setSelectedUsers(prev => [...prev, user]);
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.user_id !== userId));
  };

  const handleShareWithUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsSharing(true);
    try {
      const response = await fetch(`/api/stories/${story.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user.user_id)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share story');
      }

      // Clear selected users after successful share
      setSelectedUsers([]);
      
      console.log("Story shared successfully!", data);
      // You could show a success toast here with the message: data.message
    } catch (error) {
      console.error("Failed to share story:", error);
      // You could show an error toast here
    } finally {
      setIsSharing(false);
    }
  };

  const togglePublic = () => {
    // In a real app, this would update the database
    setIsPublic(!isPublic);
  };

  const downloadStory = () => {
    const element = document.createElement("a");
    const file = new Blob([story.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${story.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Story Content */}
          <div className="lg:col-span-3">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-heading mb-2">
                      {story.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      by {story.author} • {new Date(story.createdAt).toLocaleDateString()}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary">{story.genre}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {isPublic ? (
                          <>
                            <Globe className="h-3 w-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={downloadStory}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share Your Story</DialogTitle>
                          <DialogDescription>
                            Share this romantic tale with friends or make it public for everyone to enjoy.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1" 
                              onClick={handleCopyLink}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Link
                                </>
                              )}
                            </Button>
                            
                            <Button 
                              variant={isPublic ? "default" : "outline"}
                              onClick={togglePublic}
                            >
                              {isPublic ? (
                                <>
                                  <Globe className="mr-2 h-4 w-4" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Make Public
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <UserSearch
                              onUserSelect={handleUserSelect}
                              selectedUsers={selectedUsers}
                              onUserRemove={handleUserRemove}
                              maxSelections={5}
                              placeholder="Search users by name..."
                            />
                            
                            {selectedUsers.length > 0 && (
                              <Button 
                                onClick={handleShareWithUsers}
                                disabled={isSharing}
                                className="w-full"
                              >
                                <Users className="mr-2 h-4 w-4" />
                                {isSharing ? "Sharing..." : `Share with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`}
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown>{story.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Story Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Characters</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {story.characters.map((character) => (
                      <Badge key={character} variant="outline" className="text-xs">
                        {character}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Setting</Label>
                  <p className="text-sm font-medium">{story.setting}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Word Count</Label>
                  <p className="text-sm font-medium">
                    {story.content.split(' ').length.toLocaleString()} words
                  </p>
                </div>
              </CardContent>
            </Card>

            {story.preferences && (
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Romance Elements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {story.preferences.elements?.tropes && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Tropes</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {story.preferences.elements.tropes.map((trope: string) => (
                          <Badge key={trope} variant="secondary" className="text-xs">
                            {trope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {story.preferences.elements?.heat_level && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Heat Level</Label>
                      <p className="text-sm font-medium capitalize">
                        {story.preferences.elements.heat_level}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                <Heart className="mr-2 h-4 w-4" />
                Edit Preferences
              </Button>
              <Button className="w-full" variant="outline">
                Generate Similar Story
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}