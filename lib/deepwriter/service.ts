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
    email: string,
    customHeaders?: Record<string, string>
  ): Promise<DeepwriterProject> {
    console.log('Creating DeepWriter project:', {
      projectName,
      email,
      baseURL: this.client['config']?.baseURL,
      hasApiKey: !!this.client['config']?.apiKey
    });

    const request: CreateProjectRequest = {
      newProjectName: projectName,
      email,
    };

    console.log('CreateProject request payload:', request);

    const response = await this.client.post<CreateProjectResponse>(
      '/api/createProject',
      request,
      {
        'X-API-Key': this.client['config']?.apiKey || ''
      }
    );

    console.log('CreateProject response:', response);

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
    title?: string,
    email?: string,
    customHeaders?: Record<string, string>
  ): Promise<DeepwriterProject> {
    const request: UpdateProjectRequest = {
      prompt,
      author,
      title,
      email,
    };

    await this.client.patch<void>(
      '/api/updateProject',
      request,
      { projectId },
      {
        'X-API-Key': this.client['config']?.apiKey || ''
      }
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
    options?: Omit<GenerateWorkRequest, 'projectId'>,
    customHeaders?: Record<string, string>
  ): Promise<DeepwriterJob> {
    const request: GenerateWorkRequest = {
      projectId,
      ...options,
      // Support both legacy and new parameter names
      is_default: options?.is_default ?? options?.isDefault ?? true,
    };

    const response = await this.client.post<GenerateWorkResponse>(
      '/api/generateWork',
      request,
      {
        'X-API-Key': this.client['config']?.apiKey || ''
      }
    );

    // Validate that we received a job ID
    if (!response.jobId) {
      throw new Error(`DeepWriter API did not return a job ID. Response: ${JSON.stringify(response)}`);
    }

    console.log('DeepWriter generateWork successful:', {
      jobId: response.jobId,
      message: response.message,
      projectId
    });

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
    config: Partial<RomanceGenerationConfig> = {},
    customHeaders?: Record<string, string>
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
      '/api/generateWork',
      request,
      customHeaders
    );

    // Validate that we received a job ID
    if (!response.jobId) {
      throw new Error(`DeepWriter API did not return a job ID. Response: ${JSON.stringify(response)}`);
    }

    console.log('DeepWriter generateRomanceWork successful:', {
      jobId: response.jobId,
      message: response.message,
      projectId,
      config: {
        pageLength,
        maxPages,
        mode
      }
    });

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
  async checkJobStatus(jobId: string, customHeaders?: Record<string, string>): Promise<DeepwriterJob> {
    return this.client.get<DeepwriterJob>(`/api/getJobStatus`, { jobId }, customHeaders);
  }

  /**
   * Get the content of a completed job
   */
  async getJobContent(jobId: string, customHeaders?: Record<string, string>): Promise<DeepwriterContent> {
    return this.client.get<DeepwriterContent>(`/api/jobs/${jobId}/content`, undefined, customHeaders);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string, customHeaders?: Record<string, string>): Promise<void> {
    await this.client.delete<void>(`/api/jobs/${jobId}/cancel`, customHeaders);
  }

  /**
   * Preview PDF for a completed job (for iframe display)
   */
  async previewPdf(jobId: string, customHeaders?: Record<string, string>): Promise<ArrayBuffer> {
    const response = await this.client.getRaw(`/api/previewPdf/${jobId}`, undefined, customHeaders);
    return response.arrayBuffer();
  }

  /**
   * Download PDF for a completed job (for file downloads)
   */
  async downloadPdf(jobId: string, customHeaders?: Record<string, string>): Promise<ArrayBuffer> {
    const response = await this.client.getRaw(`/api/downloadPdf/${jobId}`, undefined, customHeaders);
    return response.arrayBuffer();
  }
}

// Default configuration factory
export function createDeepwriterService(): DeepwriterService {
  console.log('Creating DeepWriter service with environment variables:', {
    DEEPWRITER_API_URL: process.env.DEEPWRITER_API_URL || 'NOT_SET',
    DEEPWRITER_API_KEY: process.env.DEEPWRITER_API_KEY ? `${process.env.DEEPWRITER_API_KEY.substring(0, 8)}...` : 'NOT_SET'
  });

  const config: DeepwriterApiConfig = {
    baseURL: process.env.DEEPWRITER_API_URL || 'https://app.deepwriter.com',
    apiKey: process.env.DEEPWRITER_API_KEY || '',
  };

  console.log('Final DeepWriter config:', {
    baseURL: config.baseURL,
    hasApiKey: !!config.apiKey,
    apiKeyLength: config.apiKey?.length || 0
  });

  if (!config.apiKey) {
    throw new Error('DEEPWRITER_API_KEY environment variable is required');
  }

  return new DeepwriterService(config);
}