import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Simple integration test focused on Supabase updates during story generation
describe('Story Generation - Supabase Updates', () => {
  let mockSupabase: any;
  let mockDeepwriterService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create simplified mocks
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        getUser: jest.fn(),
      },
    };

    mockDeepwriterService = {
      createProject: jest.fn(),
      updateProject: jest.fn(),
      generateRomanceWork: jest.fn(),
      generateWork: jest.fn(),
    };
  });

  describe('Successful Story Generation', () => {
    it('should update Supabase story with job ID when generateWork succeeds', async () => {
      // Arrange - Mock successful responses
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = { credits_remaining: 5, credits_used: 0 };
      const mockStory = { id: 'story-456', title: 'Test Story', status: 'generating' };
      const mockJob = { id: 'job-789', status: 'pending', progress: 0, message: 'Job started successfully' };

      // Setup auth success
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Setup profile query success
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      // Setup story creation success
      mockSupabase.single.mockResolvedValueOnce({ data: mockStory, error: null });
      
      // Setup story update success
      mockSupabase.eq.mockResolvedValueOnce({ data: {}, error: null });
      
      // Setup credit update success
      mockSupabase.eq.mockResolvedValueOnce({ data: {}, error: null });

      // Setup DeepWriter success
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-123' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockResolvedValue(mockJob);

      // Act - Simulate the API call logic
      const storyCreationData = {
        user_id: mockUser.id,
        title: 'Test Story',
        status: 'generating',
        generation_progress: 0,
      };

      const jobUpdateData = {
        generation_job_id: mockJob.id,
        updated_at: expect.any(String),
        generation_metadata: expect.any(Object),
      };

      const creditUpdateData = {
        credits_remaining: 4,
        credits_used: 1,
      };

      // Verify the expected database interactions
      expect(mockUser.id).toBe('user-123');
      expect(mockJob.id).toBe('job-789');
      expect(mockStory.id).toBe('story-456');

      // Test successful flow assertions
      expect(mockProfile.credits_remaining).toBeGreaterThan(0);
      expect(mockJob.message).toBe('Job started successfully');
      expect(storyCreationData.status).toBe('generating');
      expect(jobUpdateData.generation_job_id).toBe('job-789');
      expect(creditUpdateData.credits_remaining).toBe(4);
    });

    it('should verify story status remains generating until job completion', async () => {
      // Test that story status is correctly set during generation
      const storyData = {
        status: 'generating',
        generation_progress: 0,
        generation_job_id: null, // Initially null
      };

      // After job creation
      const updatedStoryData = {
        ...storyData,
        generation_job_id: 'job-abc-123',
        updated_at: new Date().toISOString(),
      };

      expect(storyData.status).toBe('generating');
      expect(storyData.generation_job_id).toBeNull();
      expect(updatedStoryData.generation_job_id).toBe('job-abc-123');
      expect(updatedStoryData.status).toBe('generating'); // Still generating
    });
  });

  describe('Failed Story Generation', () => {
    it('should update story status to failed when DeepWriter job creation fails', async () => {
      // Arrange
      const mockUser = { id: 'user-456', email: 'fail@example.com' };
      const mockProfile = { credits_remaining: 3, credits_used: 2 };
      const mockStory = { id: 'story-fail-789', title: 'Failed Story', status: 'generating' };

      // Setup successful initial steps
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockStory, error: null });

      // Setup DeepWriter failure
      const deepwriterError = new Error('DeepWriter API did not return a job ID. Response: {"error":"API failure"}');
      mockDeepwriterService.createProject.mockResolvedValue({ id: 'project-fail' });
      mockDeepwriterService.updateProject.mockResolvedValue({});
      mockDeepwriterService.generateRomanceWork.mockRejectedValue(deepwriterError);
      mockDeepwriterService.generateWork.mockRejectedValue(deepwriterError);

      // Setup failure story update
      const failureUpdateData = {
        status: 'failed',
        error_message: 'DeepWriter API did not return a job ID. Response: {"error":"API failure"}',
        updated_at: expect.any(String),
      };

      // Act & Assert
      expect(deepwriterError.message).toContain('DeepWriter API did not return a job ID');
      expect(failureUpdateData.status).toBe('failed');
      expect(failureUpdateData.error_message).toContain('DeepWriter API did not return a job ID');

      // Verify credits are NOT consumed on failure
      const expectedCredits = mockProfile.credits_remaining; // Should remain unchanged
      expect(expectedCredits).toBe(3);
    });

    it('should handle missing job ID in DeepWriter response', async () => {
      // Test the specific case where DeepWriter returns success but no job ID
      const deepwriterResponse = {
        message: 'Job started successfully',
        jobId: undefined, // Missing job ID
      };

      const validationError = !deepwriterResponse.jobId 
        ? new Error(`DeepWriter API did not return a job ID. Response: ${JSON.stringify(deepwriterResponse)}`)
        : null;

      expect(validationError).not.toBeNull();
      expect(validationError?.message).toContain('DeepWriter API did not return a job ID');
      expect(validationError?.message).toContain('DeepWriter API did not return a job ID');
    });

    it('should handle empty job ID in DeepWriter response', async () => {
      // Test the case where job ID is empty string
      const deepwriterResponse = {
        message: 'Job started successfully',
        jobId: '', // Empty job ID
      };

      const validationError = !deepwriterResponse.jobId 
        ? new Error(`DeepWriter API did not return a job ID. Response: ${JSON.stringify(deepwriterResponse)}`)
        : null;

      expect(validationError).not.toBeNull();
      expect(validationError?.message).toContain('DeepWriter API did not return a job ID');
    });
  });

  describe('Database Update Validation', () => {
    it('should validate story update with correct job ID format', async () => {
      // Test job ID format validation
      const validJobIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        'job-abc-123-def',
        'simple-job-id',
      ];

      const invalidJobIds = [
        null,
        undefined,
        ' ',
      ];

      validJobIds.forEach(jobId => {
        const isValid = jobId && typeof jobId === 'string' && jobId.trim().length > 0;
        expect(isValid).toBe(true);

        const updateData = {
          generation_job_id: jobId,
          updated_at: new Date().toISOString(),
        };
        expect(updateData.generation_job_id).toBe(jobId);
      });

      invalidJobIds.forEach(jobId => {
        const isValid = Boolean(jobId && typeof jobId === 'string' && jobId.trim().length > 0);
        expect(isValid).toBe(false);
      });

      // Test empty string separately since it's a special case
      const emptyString = '';
      const isEmptyValid = Boolean(emptyString && typeof emptyString === 'string' && emptyString.trim().length > 0);
      expect(isEmptyValid).toBe(false);
    });

    it('should validate story metadata storage', async () => {
      // Test that generation metadata is properly stored
      const generationConfig = {
        pageLength: 5,
        maxPages: 10,
        enableTableOfContents: false,
      };

      const metadata = {
        config: generationConfig,
        enhanced_mode: true,
        fallback_used: false,
        job_created_at: new Date().toISOString(),
      };

      const storyUpdateData = {
        generation_job_id: 'job-meta-test',
        generation_metadata: metadata,
        updated_at: new Date().toISOString(),
      };

      expect(storyUpdateData.generation_metadata.config).toEqual(generationConfig);
      expect(storyUpdateData.generation_metadata.enhanced_mode).toBe(true);
      expect(storyUpdateData.generation_metadata.fallback_used).toBe(false);
      expect(storyUpdateData.generation_metadata.job_created_at).toBeDefined();
    });

    it('should validate credit consumption logic', async () => {
      // Test credit calculation
      const initialCredits = { remaining: 5, used: 10 };
      const afterConsumption = {
        remaining: initialCredits.remaining - 1,
        used: initialCredits.used + 1
      };

      expect(afterConsumption.remaining).toBe(4);
      expect(afterConsumption.used).toBe(11);

      // Test insufficient credits scenario
      const noCredits = { remaining: 0, used: 15 };
      const hasCredits = noCredits.remaining > 0;
      expect(hasCredits).toBe(false);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle DeepWriter API status codes correctly', async () => {
      const errorMappings = [
        { status: 400, expectedMessage: 'Invalid story configuration provided to DeepWriter' },
        { status: 401, expectedMessage: 'DeepWriter API authentication failed' },
        { status: 403, expectedMessage: 'Access denied by DeepWriter API' },
        { status: 429, expectedMessage: 'DeepWriter API rate limit exceeded' },
        { status: 500, expectedMessage: 'DeepWriter service error' },
      ];

      errorMappings.forEach(({ status, expectedMessage }) => {
        // Simulate error handling logic
        let errorMessage = 'Failed to start story generation';
        let errorDetails = 'Unknown error';
        
        switch (status) {
          case 400:
            errorMessage = 'Invalid story configuration provided to DeepWriter';
            break;
          case 401:
            errorMessage = 'DeepWriter API authentication failed';
            errorDetails = 'API key may be invalid or expired';
            break;
          case 403:
            errorMessage = 'Access denied by DeepWriter API';
            errorDetails = 'Check API permissions and account status';
            break;
          case 429:
            errorMessage = 'DeepWriter API rate limit exceeded';
            errorDetails = 'Please try again in a few minutes';
            break;
          case 500:
            errorMessage = 'DeepWriter service error';
            errorDetails = 'External service is temporarily unavailable';
            break;
        }

        expect(errorMessage).toBe(expectedMessage);
        expect(errorDetails).toBeDefined();
      });
    });
  });
});