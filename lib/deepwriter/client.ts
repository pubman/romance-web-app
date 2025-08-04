import { 
  DeepwriterApiConfig, 
  DeepwriterError, 
  DeepwriterApiError 
} from './types';

export class DeepwriterApiClient {
  private config: DeepwriterApiConfig;

  constructor(config: DeepwriterApiConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Accept': '*/*',
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // Log request details for debugging
    console.log('DeepWriter API Request:', {
      url,
      method: requestOptions.method || 'GET',
      headers: {
        ...requestOptions.headers,
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey.substring(0, 8)}...` : 'NOT_SET'
      },
      body: requestOptions.body ? JSON.parse(requestOptions.body as string) : undefined
    });

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: DeepwriterApiError;
        let responseText: string;
        
        try {
          responseText = await response.text();
          console.log('DeepWriter API Error Response (raw):', responseText);
          
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = {
              error: 'Parse Error',
              message: responseText || response.statusText || 'Request failed',
              status: response.status,
            };
          }
        } catch {
          errorData = {
            error: 'Unknown Error',
            message: response.statusText || 'Request failed',
            status: response.status,
          };
        }

        console.log('DeepWriter API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          method: requestOptions.method || 'GET',
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });

        throw new DeepwriterError(
          errorData.message || 'API request failed',
          response.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // For non-JSON responses, return the response itself
        return response as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DeepwriterError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new DeepwriterError('Request timeout', 408, { timeout: true });
        }
        throw new DeepwriterError(error.message, 0, { originalError: error });
      }

      throw new DeepwriterError('Unknown error occurred', 0, { error });
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.makeRequest<T>(url, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.makeRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Make a raw request that returns the Response object directly
   * Useful for binary data like PDFs
   */
  async getRaw(endpoint: string, params?: Record<string, unknown>): Promise<Response> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const fullUrl = `${this.config.baseURL}${url}`;
    
    const defaultHeaders = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Accept': '*/*',
    };

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: defaultHeaders,
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(fullUrl, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: DeepwriterApiError;
        let responseText: string;
        
        try {
          responseText = await response.text();
          console.log('DeepWriter API Error Response (raw):', responseText);
          
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = {
              error: 'Parse Error',
              message: responseText || response.statusText || 'Request failed',
              status: response.status,
            };
          }
        } catch {
          errorData = {
            error: 'Unknown Error',
            message: response.statusText || 'Request failed',
            status: response.status,
          };
        }

        console.log('DeepWriter API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          method: 'GET',
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });

        throw new DeepwriterError(
          errorData.message || 'API request failed',
          response.status,
          errorData
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DeepwriterError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new DeepwriterError('Request timeout', 408, { timeout: true });
        }
        throw new DeepwriterError(error.message, 0, { originalError: error });
      }

      throw new DeepwriterError('Unknown error occurred', 0, { error });
    }
  }
}