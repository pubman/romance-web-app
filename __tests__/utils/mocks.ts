import { jest } from '@jest/globals';
import type { DeepwriterJob, GenerateWorkResponse } from '@/lib/deepwriter/types';

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
  user_id: 'test-user-id',
  credits_remaining: 5,
  credits_used: 0,
  ...overrides,
});

export const createMockStoryPreferences = (overrides = {}) => ({
  genre: 'Contemporary Romance',
  mood: 'Steamy',
  characters: {
    protagonist: {
      name: 'Emma',
      traits: ['Independent', 'Creative'],
      occupation: 'Artist'
    },
    love_interest: {
      name: 'Jake',
      traits: ['Charming', 'Mysterious'],
      occupation: 'CEO'
    }
  },
  setting: {
    time_period: 'Modern Day',
    location: 'New York City',
    atmosphere: 'Urban'
  },
  elements: {
    tropes: ['Enemies to Lovers'],
    heat_level: 'Spicy',
    story_length: 'Novella',
    conflict_type: 'Internal'
  },
  ...overrides,
});

export const createMockStory = (overrides = {}) => ({
  id: 'test-story-id',
  user_id: 'test-user-id',
  title: 'Test Story',
  status: 'generating',
  wizard_data: createMockStoryPreferences(),
  story_preferences: {
    genre: 'Contemporary Romance',
    elements: {
      tropes: ['Enemies to Lovers'],
      heat_level: 'Spicy',
      story_length: 'Novella',
      conflict_type: 'Internal'
    }
  },
  generation_progress: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockDeepwriterJob = (overrides = {}): DeepwriterJob => ({
  id: 'test-job-id',
  projectId: 'test-project-id',
  status: 'pending',
  progress: 0,
  message: 'Job started successfully',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockGenerateWorkResponse = (overrides = {}): GenerateWorkResponse => ({
  message: 'Job started successfully',
  jobId: 'test-job-id',
  ...overrides,
});

// Supabase client mock
export const createMockSupabaseClient = () => {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();

  // Chain the methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
    single: mockSingle,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
  });

  const mockAuth = {
    getUser: jest.fn(),
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    // Helper methods to access mocked functions
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
      auth: mockAuth,
    },
  };
};

// DeepWriter service mock
export const createMockDeepwriterService = () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
  generateWork: jest.fn(),
  generateRomanceWork: jest.fn(),
  checkJobStatus: jest.fn(),
});

// Mock error classes
export class MockDeepwriterError extends Error {
  constructor(message: string, public status: number, public response?: any) {
    super(message);
    this.name = 'DeepwriterError';
  }
}

// Response helpers
export const createMockResponse = <T = unknown>(data: T, error: unknown = null) => ({
  data,
  error,
});

export const createMockRequest = <T = unknown>(body: T, headers: Record<string, string> = {}) => ({
  // @ts-expect-error Jest mock typing issue
  json: jest.fn().mockResolvedValue(body),
  headers: new Map(Object.entries(headers)),
});