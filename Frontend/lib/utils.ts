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
