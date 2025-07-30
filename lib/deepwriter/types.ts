// DeepWriter API Types
// Based on the React Native blueprint for Romance by Me

export interface DeepwriterApiConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
}

export interface DeepwriterProject {
  id: string;
  name: string;
  email?: string;
  author?: string;
  title?: string;
  prompt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectRequest {
  newProjectName: string;
  email: string;
}

export interface CreateProjectResponse {
  id: string;
}

export interface UpdateProjectRequest {
  prompt: string;
  author?: string;
  title?: string;
}

export interface GenerateWorkRequest {
  projectId: string;
  is_default: boolean;
}

export interface GenerateWorkResponse {
  message: string;
  jobId: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface DeepwriterJob {
  id: string;
  projectId: string;
  status: JobStatus;
  progress: number; // 0-100
  message?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DeepwriterContent {
  id: string;
  jobId: string;
  content: {
    title?: string;
    chapters: Array<{
      id: string;
      title: string;
      content: string;
      word_count: number;
    }>;
    metadata: {
      word_count: number;
      chapter_count: number;
      reading_time: number;
      generated_at: string;
    };
  };
}

// Local database types for job tracking
export interface StoryGenerationJob {
  id: string;
  user_id: string;
  story_id: string;
  deepwriter_project_id: string;
  deepwriter_job_id: string;
  status: JobStatus;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// API Error types
export interface DeepwriterApiError {
  error: string;
  message: string;
  status: number;
}

export class DeepwriterError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'DeepwriterError';
  }
}