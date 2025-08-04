import { apiCall } from './api';

// Demo data structure matching your flow
const dummyProject = {
  newProjectName: 'Test Romance Project',
  prompt: 'Create a romantic story about two people who meet in a coffee shop...',
  author: 'Demo Author',
  title: 'Coffee Shop Romance',
};

const enhancedGenerationParams = {
  prompt: 'Create a captivating romantic story with complex characters, emotional depth, and a satisfying conclusion...',
  author: 'Demo Author',
  email: 'demo@example.com',
  outline_text: 'Chapter 1: Meeting\nChapter 2: Growing Attraction\nChapter 3: Conflict\nChapter 4: Resolution',
  has_technical_diagrams: false,
  has_tableofcontents: true,
  use_web_research: 'auto' as const,
  page_length: 5,
  mode: 'deepwriter' as const,
  max_pages: 15,
};

/**
 * Demonstrates the complete work generation flow
 * This matches the exact flow from your code snippet
 */
export async function demonstrateWorkGenerationFlow() {
  try {
    console.log('\n3. Creating new project...');
    const { id: newProjectId } = await apiCall('/api/createProject', {
      method: 'POST',
      body: JSON.stringify({ newProjectName: dummyProject.newProjectName }),
    });
    console.log('Created project with ID:', newProjectId);

    console.log('\n4. Updating project...');
    await apiCall(`/api/updateProject?projectId=${newProjectId}`, {
      method: 'PATCH',
      body: JSON.stringify(dummyProject),
    });
    console.log('Project updated successfully');

    console.log('\n5. Generating work with enhanced parameters...');
    console.log('Enhanced generation parameters:', {
      projectId: newProjectId,
      prompt: enhancedGenerationParams.prompt.substring(0, 100) + '...',
      author: enhancedGenerationParams.author,
      email: enhancedGenerationParams.email,
      outline_text: enhancedGenerationParams.outline_text.substring(0, 50) + '...',
      has_technical_diagrams: enhancedGenerationParams.has_technical_diagrams,
      has_tableofcontents: enhancedGenerationParams.has_tableofcontents,
      use_web_research: enhancedGenerationParams.use_web_research,
      page_length: enhancedGenerationParams.page_length,
      mode: enhancedGenerationParams.mode,
      isDefault: true,
      max_pages: enhancedGenerationParams.max_pages,
    });

    const { jobId } = await apiCall('/api/generateWork', {
      method: 'POST',
      body: JSON.stringify({
        projectId: newProjectId,
        ...enhancedGenerationParams,
        isDefault: true,
      }),
    });
    console.log('✅ Enhanced work generation started with job ID:', jobId);

    return {
      projectId: newProjectId,
      jobId,
      success: true,
    };

  } catch (error) {
    console.error('Work generation flow failed:', error);
    throw error;
  }
}

/**
 * Utility function to test individual API endpoints
 */
export async function testApiEndpoints() {
  console.log('Testing API endpoints...');
  
  try {
    // Test createProject
    console.log('1. Testing createProject...');
    const createResponse = await apiCall('/api/createProject', {
      method: 'POST',
      body: JSON.stringify({ newProjectName: 'Test Project' }),
    });
    console.log('createProject response:', createResponse);

    // Test updateProject
    console.log('2. Testing updateProject...');
    const updateResponse = await apiCall(`/api/updateProject?projectId=${createResponse.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        prompt: 'Test prompt',
        author: 'Test Author',
        title: 'Test Title',
      }),
    });
    console.log('updateProject response:', updateResponse);

    // Test generateWork
    console.log('3. Testing generateWork...');
    const generateResponse = await apiCall('/api/generateWork', {
      method: 'POST',
      body: JSON.stringify({
        projectId: createResponse.id,
        prompt: 'Generate test content',
        author: 'Test Author',
        email: 'test@example.com',
        page_length: 3,
        max_pages: 5,
        isDefault: true,
      }),
    });
    console.log('generateWork response:', generateResponse);

    console.log('✅ All API endpoints tested successfully!');
    return { success: true };

  } catch (error) {
    console.error('API endpoint testing failed:', error);
    throw error;
  }
}