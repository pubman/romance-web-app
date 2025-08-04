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
  RomanceGenerationConfig,
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
   * Generate work from a project (enhanced version)
   */
  async generateWork(
    projectId: string,
    options?: Omit<GenerateWorkRequest, 'projectId'>
  ): Promise<DeepwriterJob> {
    const request: GenerateWorkRequest = {
      projectId,
      ...options,
      // Support both legacy and new parameter names
      is_default: options?.is_default ?? options?.isDefault ?? true,
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
   * Generate work with enhanced parameters - romance optimized
   */
  async generateRomanceWork(
    projectId: string,
    prompt: string,
    author: string,
    email: string,
    config: Partial<RomanceGenerationConfig> = {}
  ): Promise<DeepwriterJob> {
    const {
      enableTableOfContents = false,
      enableTechnicalDiagrams = false,
      useWebResearch = 'auto',
      pageLength = 5,
      maxPages = 10,
      researchUrls = [],
      questionsAndAnswers = [],
      mode = 'deepwriter'
    } = config;

    const request: GenerateWorkRequest = {
      projectId,
      prompt,
      author,
      email,
      outline_text: this.generateOutlineFromPrompt(),
      has_technical_diagrams: enableTechnicalDiagrams ? 'on' : 'off',
      has_tableofcontents: enableTableOfContents ? 'on' : 'off',
      use_web_research: useWebResearch,
      page_length: pageLength,
      max_pages: maxPages,
      mode,
      urls_for_research: researchUrls.length > 0 ? researchUrls : undefined,
      questions_and_answers: questionsAndAnswers.length > 0 
        ? JSON.stringify(questionsAndAnswers) 
        : undefined,
      is_default: true
    };

    const response = await this.client.post<GenerateWorkResponse>(
      '/generateWork',
      request
    );

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
   * Generate outline text for better organization
   */
  private generateOutlineFromPrompt(): string {
    // Return a standard romance outline structure
    return `The story should include:
1. Character development and introduction
2. Building romantic tension  
3. Conflict and obstacles
4. Resolution and satisfying conclusion

Based on the provided prompt specifications.`;
  }

  /**
   * Check the status of a generation job
   */
  async checkJobStatus(jobId: string): Promise<DeepwriterJob> {
    return this.client.get<DeepwriterJob>(`/api/jobs/${jobId}`);
  }

  /**
   * Get the content of a completed job
   */
  async getJobContent(jobId: string): Promise<DeepwriterContent> {
    return this.client.get<DeepwriterContent>(`/api/jobs/${jobId}/content`);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<void> {
    await this.client.delete<void>(`/api/jobs/${jobId}/cancel`);
  }

  /**
   * Preview PDF for a completed job (for iframe display)
   */
  async previewPdf(jobId: string): Promise<ArrayBuffer> {
    const response = await this.client.getRaw(`/api/previewPdf/${jobId}`);
    return response.arrayBuffer();
  }

  /**
   * Download PDF for a completed job (for file downloads)
   */
  async downloadPdf(jobId: string): Promise<ArrayBuffer> {
    const response = await this.client.getRaw(`/api/downloadPdf/${jobId}`);
    return response.arrayBuffer();
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