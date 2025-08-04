import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';

interface UpdateProjectRequest {
  newProjectName?: string;
  prompt?: string;
  author?: string;
  title?: string;
  [key: string]: unknown; // Allow additional properties from the dummy project data
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const updateData: UpdateProjectRequest = await request.json();

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

    // Extract the relevant update fields
    const { prompt, author, title, newProjectName } = updateData;

    // Update project in DeepWriter
    await deepwriterService.updateProject(
      projectId,
      prompt || 'Default project prompt',
      author || user.email || user.id,
      title || newProjectName || 'Untitled Project'
    );

    return NextResponse.json({
      success: true,
      projectId,
    });

  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    );
  }
}