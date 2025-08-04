import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DeepwriterService } from '@/lib/deepwriter/service';
import { DeepwriterApiClient } from '@/lib/deepwriter/client';
import {
  createMockGenerateWorkResponse,
  createMockDeepwriterJob,
} from '../../utils/mocks';

// Mock the client
jest.mock('@/lib/deepwriter/client');

describe('DeepwriterService', () => {
  let service: DeepwriterService;
  let mockClient: jest.Mocked<DeepwriterApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock client
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      getRaw: jest.fn(),
    } as any;

    // Mock the constructor to return our mock client
    (DeepwriterApiClient as jest.MockedClass<typeof DeepwriterApiClient>).mockImplementation(() => mockClient);

    service = new DeepwriterService({
      baseURL: 'https://test.deepwriter.com',
      apiKey: 'test-api-key',
    });
  });

  describe('generateWork', () => {
    it('should successfully generate work with valid job ID', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse({
        jobId: 'valid-job-id',
        message: 'Job started successfully',
      });

      mockClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateWork('project-123', {
        is_default: true,
      });

      // Assert
      expect(result).toMatchObject({
        id: 'valid-job-id',
        projectId: 'project-123',
        status: 'pending',
        progress: 0,
        message: 'Job started successfully',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/generateWork', {
        projectId: 'project-123',
        is_default: true,
      });
    });

    it('should throw error when API returns no job ID', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse({
        jobId: undefined as any, // Missing job ID
        message: 'Error occurred',
      });

      mockClient.post.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateWork('project-123'))
        .rejects
        .toThrow('DeepWriter API did not return a job ID');

      expect(mockClient.post).toHaveBeenCalledWith('/api/generateWork', {
        projectId: 'project-123',
        is_default: true,
      });
    });

    it('should throw error when API returns empty job ID', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse({
        jobId: '', // Empty job ID
        message: 'Job started',
      });

      mockClient.post.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateWork('project-456'))
        .rejects
        .toThrow('DeepWriter API did not return a job ID');
    });

    it('should handle legacy parameter mapping', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse();
      mockClient.post.mockResolvedValue(mockResponse);

      // Act
      await service.generateWork('project-789', {
        isDefault: false, // Using legacy parameter name
      });

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/api/generateWork', {
        projectId: 'project-789',
        is_default: false, // Should be mapped to is_default
        isDefault: false,
      });
    });
  });

  describe('generateRomanceWork', () => {
    it('should successfully generate romance work with enhanced config', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse({
        jobId: 'romance-job-id',
        message: 'Romance generation started',
      });

      mockClient.post.mockResolvedValue(mockResponse);

      const config = {
        enableTableOfContents: true,
        enableTechnicalDiagrams: false,
        useWebResearch: 'auto' as const,
        pageLength: 8,
        maxPages: 15,
        researchUrls: ['https://example.com'],
        questionsAndAnswers: [{ question: 'Test?', answer: 'Yes' }],
        mode: 'deepwriter' as const,
      };

      // Act
      const result = await service.generateRomanceWork(
        'project-romance',
        'Romance prompt',
        'author@test.com',
        'author@test.com',
        config
      );

      // Assert
      expect(result).toMatchObject({
        id: 'romance-job-id',
        projectId: 'project-romance',
        status: 'pending',
        progress: 0,
        message: 'Romance generation started',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/generateWork', 
        expect.objectContaining({
          projectId: 'project-romance',
          prompt: 'Romance prompt',
          author: 'author@test.com',
          email: 'author@test.com',
          has_tableofcontents: 'on',
          has_technical_diagrams: 'off',
          use_web_research: 'auto',
          page_length: 8,
          max_pages: 15,
          mode: 'deepwriter',
          urls_for_research: ['https://example.com'],
          questions_and_answers: JSON.stringify([{ question: 'Test?', answer: 'Yes' }]),
          is_default: true,
        })
      );
    });

    it('should use default config when no config provided', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse();
      mockClient.post.mockResolvedValue(mockResponse);

      // Act
      await service.generateRomanceWork(
        'project-default',
        'Default prompt',
        'author@test.com',
        'author@test.com'
      );

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/api/generateWork',
        expect.objectContaining({
          has_tableofcontents: 'off',
          has_technical_diagrams: 'off',
          use_web_research: 'auto',
          page_length: 5,
          max_pages: 10,
          mode: 'deepwriter',
          urls_for_research: undefined,
          questions_and_answers: undefined,
        })
      );
    });

    it('should throw error when romance generation returns no job ID', async () => {
      // Arrange
      const mockResponse = createMockGenerateWorkResponse({
        jobId: null as any,
        message: 'Generation failed',
      });

      mockClient.post.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateRomanceWork(
        'project-fail',
        'Failed prompt',
        'author@test.com',
        'author@test.com'
      )).rejects.toThrow('DeepWriter API did not return a job ID');
    });
  });

  describe('checkJobStatus', () => {
    it('should successfully check job status', async () => {
      // Arrange
      const mockJob = createMockDeepwriterJob({
        id: 'status-job-id',
        status: 'processing',
        progress: 50,
      });

      mockClient.get.mockResolvedValue(mockJob);

      // Act
      const result = await service.checkJobStatus('status-job-id');

      // Assert
      expect(result).toEqual(mockJob);
      expect(mockClient.get).toHaveBeenCalledWith('/api/getJobStatus', {
        jobId: 'status-job-id',
      });
    });

    it('should handle job status check with different statuses', async () => {
      // Test different job statuses
      const statuses: Array<'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = [
        'pending', 'processing', 'completed', 'failed', 'cancelled'
      ];

      for (const status of statuses) {
        // Arrange
        const mockJob = createMockDeepwriterJob({
          id: `job-${status}`,
          status,
          progress: status === 'completed' ? 100 : 25,
        });

        mockClient.get.mockResolvedValue(mockJob);

        // Act
        const result = await service.checkJobStatus(`job-${status}`);

        // Assert
        expect(result.status).toBe(status);
        expect(result.id).toBe(`job-${status}`);
      }
    });
  });

  describe('error handling', () => {
    it('should propagate client errors for generateWork', async () => {
      // Arrange
      const clientError = new Error('Network error');
      mockClient.post.mockRejectedValue(clientError);

      // Act & Assert
      await expect(service.generateWork('project-error'))
        .rejects
        .toThrow('Network error');
    });

    it('should propagate client errors for checkJobStatus', async () => {
      // Arrange
      const clientError = new Error('API error');
      mockClient.get.mockRejectedValue(clientError);

      // Act & Assert
      await expect(service.checkJobStatus('error-job'))
        .rejects
        .toThrow('API error');
    });
  });

  describe('project management', () => {
    it('should create project successfully', async () => {
      // Arrange
      const mockResponse = { id: 'new-project-id' };
      mockClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.createProject('Test Project', 'test@example.com');

      // Assert
      expect(result).toEqual({
        id: 'new-project-id',
        name: 'Test Project',
        email: 'test@example.com',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/createProject', {
        newProjectName: 'Test Project',
        email: 'test@example.com',
      });
    });

    it('should update project successfully', async () => {
      // Arrange
      mockClient.patch.mockResolvedValue(undefined);

      // Act
      const result = await service.updateProject(
        'project-update',
        'Updated prompt',
        'author@test.com',
        'Updated Title',
        'author@test.com'
      );

      // Assert
      expect(result).toEqual({
        id: 'project-update',
        name: 'Updated Title',
        prompt: 'Updated prompt',
        author: 'author@test.com',
        title: 'Updated Title',
      });

      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/updateProject',
        {
          prompt: 'Updated prompt',
          author: 'author@test.com',
          title: 'Updated Title',
          email: 'author@test.com',
        },
        { projectId: 'project-update' }
      );
    });
  });
});