import { DeepwriterApiClient } from './client';
import {
  DeepwriterProject,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  GenerateWorkRequest,
  GenerateWorkResponse,
  DeepwriterJob,
  DeepwriterContent,
  DeepwriterApiConfig,
} from './types';

export class DeepwriterService {
  private client: DeepwriterApiClient;

  constructor(config: DeepwriterApiConfig) {
    this.client = new DeepwriterApiClient(config);
  }

  /**
   * Create a new project in DeepWriter
   */
  async createProject(
    projectName: string,
    email: string
  ): Promise<DeepwriterProject> {
    const request: CreateProjectRequest = {
      newProjectName: projectName,
      email,
    };

    const response = await this.client.post<CreateProjectResponse>(
      '/createProject',
      request
    );

    // Return a project object with the ID
    return {
      id: response.id,
      name: projectName,
      email,
    };
  }

  /**
   * Update an existing project with prompt and metadata
   */
  async updateProject(
    projectId: string,
    prompt: string,
    author?: string,
    title?: string
  ): Promise<DeepwriterProject> {
    const request: UpdateProjectRequest = {
      prompt,
      author,
      title,
    };

    await this.client.patch<void>(
      '/updateProject',
      request,
      { projectId }
    );

    // Return updated project object
    return {
      id: projectId,
      name: title || 'Untitled',
      prompt,
      author,
      title,
    };
  }

  /**
   * Generate work from a project
   */
  async generateWork(
    projectId: string,
    isDefault: boolean = true
  ): Promise<DeepwriterJob> {
    const request: GenerateWorkRequest = {
      projectId,
      is_default: isDefault,
    };

    const response = await this.client.post<GenerateWorkResponse>(
      '/generateWork',
      request
    );

    // Return a job object with the initial status
    return {
      id: response.jobId,
      projectId,
      status: 'pending',
      progress: 0,
      message: response.message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Check the status of a generation job
   */
  async checkJobStatus(jobId: string): Promise<DeepwriterJob> {
    return this.client.get<DeepwriterJob>(`/jobs/${jobId}/status`);
  }

  /**
   * Get the content of a completed job
   */
  async getJobContent(jobId: string): Promise<DeepwriterContent> {
    return this.client.get<DeepwriterContent>(`/jobs/${jobId}/content`);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<void> {
    await this.client.delete<void>(`/jobs/${jobId}/cancel`);
  }
}

// Default configuration factory
export function createDeepwriterService(): DeepwriterService {
  const config: DeepwriterApiConfig = {
    baseURL: process.env.DEEPWRITER_API_URL || 'https://www.deepwriter.com/api',
    apiKey: process.env.DEEPWRITER_API_KEY || '',
  };

  if (!config.apiKey) {
    throw new Error('DEEPWRITER_API_KEY environment variable is required');
  }

  return new DeepwriterService(config);
}