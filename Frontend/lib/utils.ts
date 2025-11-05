import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
}

export function getExecutorApiUrl(): string {
  return process.env.NEXT_PUBLIC_EXECUTOR_API_URL || 'http://localhost:8080'
}

export function getExecutorWsUrl(): string {
  const httpUrl = getExecutorApiUrl();
  return httpUrl.replace(/^http/, 'ws');
}

// Helper function to handle automatic logout on token expiry
export function handleAuthError(response: Response) {
  // Check if response is 401 (Unauthorized) or 403 (Forbidden)
  if (response.status === 401 || response.status === 403) {
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('facultyData');
      localStorage.removeItem('studentData');
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }
}

// Wrapper function for fetch that handles auth errors automatically
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);
  
  // Handle auth errors automatically
  if (!response.ok && (response.status === 401 || response.status === 403)) {
    handleAuthError(response);
    throw new Error('Authentication failed. Please login again.');
  }
  
  return response;
}
