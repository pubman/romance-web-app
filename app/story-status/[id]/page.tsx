"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock,
  BookOpen,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useStoryStatus } from "@/hooks/use-story-status";

export default function StoryStatusPage() {
  const params = useParams();
  const storyId = params.id as string;
  
  // For now, we'll get the jobId from the story status API
  // In a real implementation, you might pass this from the previous page
  const { status, loading, error, refetch, isPolling } = useStoryStatus(storyId);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Track elapsed time
  useEffect(() => {
    if (status?.story.status === 'generating') {
      const startTime = Date.now();
      const timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status?.story.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Generating
        </Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      default:
        return <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </Badge>;
    }
  };

  const getProgressMessage = (progress: number, status: string, progressStage?: string) => {
    if (status === 'completed') return "Your story is ready!";
    if (status === 'failed') return "Story generation failed";
    
    // Use progress stage if available
    if (progressStage) {
      switch (progressStage) {
        case 'initializing':
          return "Initializing story generation...";
        case 'planning_story':
          return "Planning your story structure...";
        case 'generating_work':
          return "AI is writing your story...";
        case 'finalizing':
          return "Adding finishing touches...";
        case 'draft':
          return "Story is in draft mode";
        default:
          break;
      }
    }
    
    // Fallback to progress-based messages
    if (progress < 10) return "Starting story generation...";
    if (progress < 30) return "Creating characters and setting...";
    if (progress < 60) return "Writing story chapters...";
    if (progress < 90) return "Adding finishing touches...";
    return "Almost done...";
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading story status...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Error Loading Story</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button onClick={refetch} variant="outline">
                  Try Again
                </Button>
                <Button asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <p className="text-muted-foreground">Story not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Status Card */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-heading">{status.story.title}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {getProgressMessage(status.story.progress, status.story.status, status.story.progress_stage)}
                  </CardDescription>
                </div>
                {getStatusBadge(status.story.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{status.story.progress}%</span>
                      {status.story.percent_complete !== undefined && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({Math.round(status.story.percent_complete * 100)}% complete)
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={status.story.progress} className="h-3" />
                  {status.story.progress_stage && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Stage: {status.story.progress_stage.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {status.story.status === 'generating' && (
                  <>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Time elapsed: {formatTime(timeElapsed)}</span>
                      {isPolling && (
                        <span className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          Live updates active
                        </span>
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Sparkles className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          AI is crafting your story
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This usually takes 2-5 minutes. Feel free to browse other tabs while you wait!
                      </p>
                    </div>
                  </>
                )}

                {status.story.status === 'completed' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Your story is ready to read!
                        </span>
                      </div>
                      <Button asChild>
                        <Link href={`/story/${status.story.id}`}>
                          Read Story
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {status.story.status === 'failed' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <XCircle className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        Story generation failed
                      </span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      {status.story.error_message || "Something went wrong during generation. You can try creating a new story."}
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/create-story">Create New Story</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Details Card (for debugging/technical info) */}
          {status.job && (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Generation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Job ID:</span>
                    <p className="font-mono text-xs break-all">{status.job.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="capitalize">{status.job.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress Stage:</span>
                    <p className="capitalize">{status.job.progress_stage?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">BYOK:</span>
                    <p>{status.job.is_byok ? 'Yes' : 'No'}</p>
                  </div>
                  {status.job.message && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Message:</span>
                      <p>{status.job.message}</p>
                    </div>
                  )}
                  
                  {/* AI Models Section */}
                  {status.job.models && (
                    <div className="col-span-2 mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">AI Models</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Reasoning:</span>
                          <span className="font-mono">{status.job.models.reasoning}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Writing:</span>
                          <span className="font-mono">{status.job.models.writing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Function:</span>
                          <span className="font-mono">{status.job.models.function}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={refetch}>
              Refresh Status
            </Button>
            {status.story.status === 'completed' && (
              <Button asChild>
                <Link href={`/story/${status.story.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Your Story
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}