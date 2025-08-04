import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Helper to create a mock NextRequest
export const createMockNextRequest = (body: any, options: {
  method?: string;
  headers?: Record<string, string>;
} = {}) => {
  const { method = 'POST', headers = {} } = options;
  
  const request = {
    json: jest.fn().mockResolvedValue(body),
    method,
    headers: new Headers(headers),
    url: 'http://localhost:3000/api/test',
  } as unknown as NextRequest;

  return request;
};

// Helper to extract response data from NextResponse
export const extractResponseData = async (response: NextResponse) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Helper to create assertion matchers for Supabase operations
export const expectSupabaseInsert = (mockSupabase: any, table: string, data: any) => {
  expect(mockSupabase._mocks.from).toHaveBeenCalledWith(table);
  expect(mockSupabase._mocks.insert).toHaveBeenCalledWith(data);
};

export const expectSupabaseUpdate = (mockSupabase: any, table: string, data: any, whereField: string, whereValue: any) => {
  expect(mockSupabase._mocks.from).toHaveBeenCalledWith(table);
  expect(mockSupabase._mocks.update).toHaveBeenCalledWith(data);
  expect(mockSupabase._mocks.eq).toHaveBeenCalledWith(whereField, whereValue);
};

export const expectSupabaseSelect = (mockSupabase: any, table: string, fields: string, whereField?: string, whereValue?: any) => {
  expect(mockSupabase._mocks.from).toHaveBeenCalledWith(table);
  expect(mockSupabase._mocks.select).toHaveBeenCalledWith(fields);
  if (whereField && whereValue) {
    expect(mockSupabase._mocks.eq).toHaveBeenCalledWith(whereField, whereValue);
  }
};

// Helper to set up Supabase mock responses
export const setupSupabaseMockResponse = (mockSupabase: any, responses: {
  auth?: { data: any; error?: any };
  select?: { data: any; error?: any };
  insert?: { data: any; error?: any };
  update?: { data: any; error?: any };
}) => {
  if (responses.auth) {
    mockSupabase._mocks.auth.getUser.mockResolvedValue(responses.auth);
  }
  
  if (responses.select) {
    mockSupabase._mocks.single.mockResolvedValue(responses.select);
  }
  
  if (responses.insert) {
    mockSupabase._mocks.single.mockResolvedValue(responses.insert);
  }
  
  if (responses.update) {
    mockSupabase._mocks.eq.mockResolvedValue(responses.update);
  }
};

// Helper to verify error responses
export const expectErrorResponse = async (response: NextResponse, status: number, errorMessage?: string) => {
  expect(response.status).toBe(status);
  
  if (errorMessage) {
    const data = await extractResponseData(response);
    expect(data.error).toContain(errorMessage);
  }
};

// Helper to verify success responses
export const expectSuccessResponse = async (response: NextResponse, expectedData?: any) => {
  expect(response.status).toBe(200);
  
  if (expectedData) {
    const data = await extractResponseData(response);
    expect(data).toMatchObject(expectedData);
  }
};

// Time helpers for consistent testing
export const freezeTime = (date: string) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(date));
};

export const restoreTime = () => {
  jest.useRealTimers();
};

// Database state helpers
export const mockDatabaseStateChanges = () => {
  const state = {
    stories: new Map(),
    profiles: new Map(),
  };

  return {
    state,
    addStory: (id: string, story: any) => state.stories.set(id, story),
    getStory: (id: string) => state.stories.get(id),
    updateStory: (id: string, updates: any) => {
      const current = state.stories.get(id) || {};
      state.stories.set(id, { ...current, ...updates });
    },
    addProfile: (userId: string, profile: any) => state.profiles.set(userId, profile),
    getProfile: (userId: string) => state.profiles.get(userId),
    updateProfile: (userId: string, updates: any) => {
      const current = state.profiles.get(userId) || {};
      state.profiles.set(userId, { ...current, ...updates });
    },
  };
};