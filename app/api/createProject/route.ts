import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';

interface CreateProjectRequest {
  newProjectName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { newProjectName }: CreateProjectRequest = await request.json();

    if (!newProjectName) {
      return NextResponse.json(
        { error: 'newProjectName is required' },
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

    // Initialize DeepWriter service
    const deepwriterService = createDeepwriterService();

    // Create project in DeepWriter
    const project = await deepwriterService.createProject(
      newProjectName,
      user.email || user.id
    );

    return NextResponse.json({
      id: project.id,
    });

  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}