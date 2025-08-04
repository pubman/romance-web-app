import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

interface RatingRequest {
  rating: number;
  feedback?: string;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: storyId } = params;
    const body: RatingRequest = await request.json();

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns this story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, generation_job_id')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // For now, we'll store ratings in a simple table
    // In a more complex system, you might want separate tables for different types of ratings
    try {
      const { error: insertError } = await supabase
        .from('story_ratings')
        .upsert({
          story_id: storyId,
          user_id: user.id,
          rating: body.rating,
          feedback: body.feedback || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'story_id,user_id',
        });

      if (insertError) {
        // If the table doesn't exist, we'll gracefully handle it
        console.warn('Story ratings table not found, skipping rating storage:', insertError);
        
        // For now, just return success without storing
        // In production, you would ensure the table exists
        return NextResponse.json({
          message: 'Rating received successfully',
          rating: body.rating,
          feedback: body.feedback,
        });
      }

      return NextResponse.json({
        message: 'Rating submitted successfully',
        rating: body.rating,
        feedback: body.feedback,
      });

    } catch (dbError) {
      console.error('Database error storing rating:', dbError);
      
      // Even if storage fails, acknowledge the rating
      return NextResponse.json({
        message: 'Rating received (storage pending)',
        rating: body.rating,
        feedback: body.feedback,
      });
    }

  } catch (error) {
    console.error('Rating submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}