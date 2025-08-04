import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeepwriterService } from '@/lib/deepwriter/service';

interface GenerateWorkRequest {
  projectId: string;
  prompt?: string;
  author?: string;
  email?: string;
  outline_text?: string;
  has_technical_diagrams?: boolean;
  has_tableofcontents?: boolean;
  use_web_research?: 'auto' | 'on' | 'off';
  page_length?: number;
  mode?: 'deepwriter' | 'default';
  isDefault?: boolean;
  max_pages?: number;
}

export async function POST(request: NextRequest) {
  try {
    const {
      projectId,
      prompt,
      author,
      email,
      outline_text,
      has_technical_diagrams = false,
      has_tableofcontents = false,
      use_web_research = 'auto',
      page_length = 5,
      mode = 'deepwriter',
      isDefault = true,
      max_pages = 10,
    }: GenerateWorkRequest = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
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

    // Prepare enhanced generation configuration
    const generationConfig = {
      enableTableOfContents: has_tableofcontents,
      enableTechnicalDiagrams: has_technical_diagrams,
      useWebResearch: use_web_research,
      pageLength: page_length,
      maxPages: max_pages,
      mode,
    };

    console.log('Enhanced generation parameters:', {
      projectId,
      prompt: prompt?.substring(0, 100) + '...',
      author,
      email,
      outline_text: outline_text?.substring(0, 50) + '...',
      has_technical_diagrams,
      has_tableofcontents,
      use_web_research,
      page_length,
      mode,
      isDefault,
      max_pages,
    });

    // Generate work with enhanced parameters
    const job = await deepwriterService.generateRomanceWork(
      projectId,
      prompt || 'Generate a romantic story',
      author || user.email || user.id,
      email || user.email || user.id,
      generationConfig
    );

    console.log('✅ Enhanced work generation started with job ID:', job.id);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: job.message || 'Work generation started successfully',
    });

  } catch (error) {
    console.error('Generate work error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate work' },
      { status: 500 }
    );
  }
}