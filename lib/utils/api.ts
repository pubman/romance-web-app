interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
}

export async function apiCall<T = unknown>(
  url: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
  } = options;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${method} ${url}:`, error);
    throw error;
  }
}