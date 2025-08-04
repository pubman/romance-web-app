import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/stories/generate/route';
import {
  createMockNextRequest,
  extractResponseData,
  expectErrorResponse,
  expectSuccessResponse,
  setupSupabaseMockResponse,
  expectSupabaseInsert,
  expectSupabaseUpdate,
} from '../../utils/test-helpers';
import {
  createMockUser,
  createMockProfile,
  createMockStoryPreferences,
  createMockStory,
  createMockSupabaseClient,
  createMockDeepwriterService,
  createMockDeepwriterJob,
  MockDeepwriterError,
  createMockResponse,
} from '../../utils/mocks';

// Mock modules
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/deepwriter/service', () => ({
  createDeepwriterService: jest.fn(),
}));

jest.mock('@/lib/deepwriter/prompt-generator', () => ({
  generateDeepWriterPrompt: jest.fn().mockReturnValue('Generated prompt text'),
}));

jest.mock('@/lib/deepwriter/config-mapper', () => ({
  mapStoryPreferencesToConfig: jest.fn().mockReturnValue({
    pageLength: 5,
    maxPages: 10,
    enableTableOfContents: false,
    enableTechnicalDiagrams: false,
    useWebResearch: 'auto',
  }),
}));

describe('/api/stories/generate', () => {
  let mockSupabase: any;
  let mockDeepwriterService: any;
  const { createClient } = require('@/lib/supabase/server');
  const { createDeepwriterService } = require('@/lib/deepwriter/service');

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = createMockSupabaseClient();
    mockDeepwriterService = createMockDeepwriterService();
    
    createClient.mockResolvedValue(mockSupabase);
    createDeepwriterService.mockReturnValue(mockDeepwriterService);
  });

  describe('Success Cases', () => {
    it('should create story and update with job ID on successful generation', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 5 });
      const preferences = createMockStoryPreferences();
      const story = createMockStory();
      const job = createMockDeepwriterJob();
      
      const request = createMockNextRequest({
        title: 'Test Story',
        preferences,
      });

      // Setup Supabase mocks
      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile), // For profile query
        insert: createMockResponse(story), // For story creation
        update: createMockResponse({}, null), // For story update and credit consumption
      });

      // Setup DeepWriter mocks
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-id', name: 'Test Story' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockResolvedValue(job);

      // Act
      const response = await POST(request);
      const data = await extractResponseData(response);

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.story.id).toBe(story.id);
      expect(data.job.id).toBe(job.id);

      // Verify story creation
      expectSupabaseInsert(mockSupabase, 'stories', expect.objectContaining({
        user_id: user.id,
        title: 'Test Story',
        status: 'generating',
        generation_progress: 0,
      }));

      // Verify story update with job ID
      expectSupabaseUpdate(mockSupabase, 'stories', expect.objectContaining({
        generation_job_id: job.id,
      }), 'id', story.id);

      // Verify credit consumption
      expectSupabaseUpdate(mockSupabase, 'profiles', expect.objectContaining({
        credits_remaining: 4,
        credits_used: 1,
      }), 'user_id', user.id);
    });

    it('should fallback to basic generation when enhanced mode fails', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 3 });
      const preferences = createMockStoryPreferences();
      const story = createMockStory();
      const fallbackJob = createMockDeepwriterJob({ id: 'fallback-job-id' });
      
      const request = createMockNextRequest({
        title: 'Fallback Test Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile),
        insert: createMockResponse(story),
        update: createMockResponse({}, null),
      });

      // Setup DeepWriter mocks - enhanced fails, basic succeeds
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-id' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockRejectedValue(new Error('Enhanced mode failed'));
      mockDeepwriterService.generateWork.mockResolvedValue(fallbackJob);

      // Act
      const response = await POST(request);
      const data = await extractResponseData(response);

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job.id).toBe(fallbackJob.id);

      // Verify fallback was used
      expect(mockDeepwriterService.generateRomanceWork).toHaveBeenCalled();
      expect(mockDeepwriterService.generateWork).toHaveBeenCalledWith('project-id', {
        is_default: true,
      });
    });
  });

  describe('Failure Cases - DeepWriter API Errors', () => {
    it('should update story to failed status when DeepWriter returns no job ID', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 2 });
      const preferences = createMockStoryPreferences();
      const story = createMockStory();
      
      const request = createMockNextRequest({
        title: 'Failed Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile),
        insert: createMockResponse(story),
        update: createMockResponse({}, null),
      });

      // DeepWriter service throws error for missing job ID
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-id' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockRejectedValue(
        new Error('DeepWriter API did not return a job ID. Response: {"message":"Error"}')
      );
      mockDeepwriterService.generateWork.mockRejectedValue(
        new Error('DeepWriter API did not return a job ID. Response: {"message":"Error"}')
      );

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 500, 'Failed to start story generation');

      // Verify story was marked as failed
      expectSupabaseUpdate(mockSupabase, 'stories', expect.objectContaining({
        status: 'failed',
        error_message: expect.stringContaining('DeepWriter API did not return a job ID'),
      }), 'id', story.id);
    });

    it('should handle DeepWriter API authentication error (401)', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 1 });
      const preferences = createMockStoryPreferences();
      const story = createMockStory();
      
      const request = createMockNextRequest({
        title: 'Auth Failed Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile),
        insert: createMockResponse(story),
        update: createMockResponse({}, null),
      });

      // DeepWriter API returns 401 error
      const authError = new MockDeepwriterError('Authentication failed', 401, {
        message: 'Invalid API key'
      });
      
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-id' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockRejectedValue(authError);
      mockDeepwriterService.generateWork.mockRejectedValue(authError);

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 401, 'DeepWriter API authentication failed');

      // Verify story failure handling
      expectSupabaseUpdate(mockSupabase, 'stories', expect.objectContaining({
        status: 'failed',
        error_message: 'API key may be invalid or expired',
      }), 'id', story.id);
    });

    it('should handle DeepWriter API rate limit error (429)', async () => {
      // Arrange  
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 1 });
      const preferences = createMockStoryPreferences();
      const story = createMockStory();
      
      const request = createMockNextRequest({
        title: 'Rate Limited Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile),
        insert: createMockResponse(story),
        update: createMockResponse({}, null),
      });

      const rateLimitError = new MockDeepwriterError('Rate limit exceeded', 429, {
        message: 'Too many requests'
      });
      
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-id' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockRejectedValue(rateLimitError);
      mockDeepwriterService.generateWork.mockRejectedValue(rateLimitError);

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 429, 'DeepWriter API rate limit exceeded');
    });
  });

  describe('Failure Cases - Supabase Errors', () => {
    it('should return error when story creation in database fails', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 3 });
      const preferences = createMockStoryPreferences();
      
      const request = createMockNextRequest({
        title: 'DB Failed Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile), // Profile query succeeds
        insert: createMockResponse(null, { message: 'Database insert failed' }), // Story creation fails
      });

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 500, 'Failed to create story record');

      // Verify DeepWriter service was not called
      expect(mockDeepwriterService.createProject).not.toHaveBeenCalled();
    });

    it('should return error when job ID update in database fails', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 2 });
      const preferences = createMockStoryPreferences();
      const story = createMockStory();
      const job = createMockDeepwriterJob();
      
      const request = createMockNextRequest({
        title: 'Update Failed Story',
        preferences,
      });

      // Story creation succeeds, but job ID update fails
      let callCount = 0;
      mockSupabase._mocks.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call (profile query) succeeds
          return { single: jest.fn().mockResolvedValue(createMockResponse(profile)) };
        } else if (callCount === 2) {
          // Second call (story update) fails
          return createMockResponse(null, { message: 'Failed to update story with job ID' });
        }
        return createMockResponse({}, null);
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        insert: createMockResponse(story),
      });

      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-id' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockResolvedValue(job);

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 500, 'Failed to update story with job ID');
    });
  });

  describe('Validation Cases', () => {
    it('should return error when title is missing', async () => {
      // Arrange
      const preferences = createMockStoryPreferences();
      const request = createMockNextRequest({
        preferences, // Missing title
      });

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 400, 'Title and preferences are required');
    });

    it('should return error when preferences are missing', async () => {
      // Arrange
      const request = createMockNextRequest({
        title: 'Test Story', // Missing preferences
      });

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 400, 'Title and preferences are required');
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange
      const preferences = createMockStoryPreferences();
      const request = createMockNextRequest({
        title: 'Unauthenticated Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user: null }, error: new Error('Not authenticated') },
      });

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 401, 'Authentication required');
    });

    it('should return error when user has insufficient credits', async () => {
      // Arrange
      const user = createMockUser();
      const profile = createMockProfile({ credits_remaining: 0 }); // No credits
      const preferences = createMockStoryPreferences();
      
      const request = createMockNextRequest({
        title: 'No Credits Story',
        preferences,
      });

      setupSupabaseMockResponse(mockSupabase, {
        auth: { data: { user }, error: null },
        select: createMockResponse(profile),
      });

      // Act
      const response = await POST(request);

      // Assert
      await expectErrorResponse(response, 402, 'Insufficient credits');
    });
  });
});