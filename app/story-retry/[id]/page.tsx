"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle, User, MapPin, Clock, Heart, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { createClient } from '@/lib/supabase/client';
import { useStoryRetry } from '@/hooks/use-story-retry';
import { DatabaseStory } from '@/hooks/use-user-stories';

export default function StoryRetryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<DatabaseStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { retryStory, isRetrying, error: retryError } = useStoryRetry();

  const supabase = createClient();

  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .eq('user_id', user.id)
          .eq('status', 'failed')
          .single();

        if (fetchError || !data) {
          setError('Story not found or not eligible for retry');
          return;
        }

        setStory(data);
      } catch (err) {
        console.error('Error fetching story:', err);
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, supabase, router]);

  const handleRetry = async () => {
    if (!story) return;

    const result = await retryStory(story.id);
    if (result?.success) {
      // Redirect to story status page to monitor progress
      router.push(`/story-status/${story.id}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Story not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const preferences = story.wizard_data;
  if (!preferences) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Story preferences not found. Cannot retry generation.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">Story Generation Failed</h1>
            <p className="text-muted-foreground mt-2">
              Let's try generating "{story.title}" again with your original preferences
            </p>
          </div>
        </div>

        {/* Reassurance Card */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Don't worry!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Failed jobs don't cost any credits. Only successful story generations will use your credits, 
                  so you can retry as many times as needed without worry.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {story.error_message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Previous Error:</strong> {story.error_message}
            </AlertDescription>
          </Alert>
        )}

        {/* Story Preferences Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Your Story Preferences
            </CardTitle>
            <CardDescription>
              Review the preferences that will be used to regenerate your story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Genre & Mood */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Genre & Mood
              </h3>
              <div className="flex gap-2">
                <Badge variant="secondary">{preferences.genre || 'Romance'}</Badge>
                <Badge variant="outline">{preferences.mood || 'Not specified'}</Badge>
              </div>
            </div>

            <Separator />

            {/* Characters */}
            {preferences.characters && (
              <>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Characters
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {preferences.characters.protagonist && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Protagonist</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Name:</strong> {preferences.characters.protagonist.name}</p>
                          {preferences.characters.protagonist.occupation && (
                            <p><strong>Occupation:</strong> {preferences.characters.protagonist.occupation}</p>
                          )}
                          {preferences.characters.protagonist.traits && preferences.characters.protagonist.traits.length > 0 && (
                            <div>
                              <strong>Traits:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {preferences.characters.protagonist.traits.map((trait, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">{trait}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {preferences.characters.love_interest && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Love Interest</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Name:</strong> {preferences.characters.love_interest.name}</p>
                          {preferences.characters.love_interest.occupation && (
                            <p><strong>Occupation:</strong> {preferences.characters.love_interest.occupation}</p>
                          )}
                          {preferences.characters.love_interest.traits && preferences.characters.love_interest.traits.length > 0 && (
                            <div>
                              <strong>Traits:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {preferences.characters.love_interest.traits.map((trait, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">{trait}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Setting */}
            {preferences.setting && (
              <>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Setting
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    {preferences.setting.time_period && (
                      <div>
                        <h4 className="font-medium">Time Period</h4>
                        <p className="text-muted-foreground">{preferences.setting.time_period}</p>
                      </div>
                    )}
                    {preferences.setting.location && (
                      <div>
                        <h4 className="font-medium">Location</h4>
                        <p className="text-muted-foreground">{preferences.setting.location}</p>
                      </div>
                    )}
                    {preferences.setting.atmosphere && (
                      <div>
                        <h4 className="font-medium">Atmosphere</h4>
                        <p className="text-muted-foreground">{preferences.setting.atmosphere}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Story Elements */}
            {preferences.elements && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Story Elements
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {preferences.elements.tropes && preferences.elements.tropes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tropes</h4>
                      <div className="flex flex-wrap gap-1">
                        {preferences.elements.tropes.map((trope, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{trope}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {preferences.elements.heat_level && (
                      <div>
                        <h4 className="font-medium">Heat Level</h4>
                        <Badge variant="outline">{preferences.elements.heat_level}</Badge>
                      </div>
                    )}
                    {preferences.elements.story_length && (
                      <div>
                        <h4 className="font-medium">Length</h4>
                        <Badge variant="outline">{preferences.elements.story_length}</Badge>
                      </div>
                    )}
                    {preferences.elements.conflict_type && (
                      <div>
                        <h4 className="font-medium">Conflict Type</h4>
                        <Badge variant="outline">{preferences.elements.conflict_type}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retry Error */}
        {retryError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{retryError}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={isRetrying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-primary hover:bg-primary/90"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}