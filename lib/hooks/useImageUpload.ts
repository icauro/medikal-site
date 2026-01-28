'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UploadProgress {
  isLoading: boolean;
  progress: number; // 0-100
  error: string | null;
  success: boolean;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  type?: string;
  error?: string;
}

/**
 * Hook for uploading images to Cloudflare R2
 * 
 * Usage:
 * const { upload, isLoading, error, success } = useImageUpload();
 * 
 * const handleFileChange = async (e) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     const result = await upload(file, 'profile');
 *   }
 * };
 */
export function useImageUpload() {
  const { user } = useAuth();
  const [state, setState] = useState<UploadProgress>({
    isLoading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const upload = useCallback(
    async (file: File, type: 'profile' | 'review' = 'profile'): Promise<UploadResponse> => {
      // Reset state
      setState({
        isLoading: true,
        progress: 0,
        error: null,
        success: false,
      });

      // Validate user is authenticated
      if (!user) {
        const errorMsg = 'User not authenticated. Please log in to upload images.';
        setState({
          isLoading: false,
          progress: 0,
          error: errorMsg,
          success: false,
        });
        return { success: false, error: errorMsg };
      }

      try {
        // Get authentication token
        const {
          data: { session },
          error: sessionError,
        } = await (await import('@/lib/supabase')).supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          const errorMsg = 'Failed to get authentication token. Please log in again.';
          setState({
            isLoading: false,
            progress: 0,
            error: errorMsg,
            success: false,
          });
          return { success: false, error: errorMsg };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        // Simulate progress updates (since we can't track real progress with FormData)
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 20, 90),
          }));
        }, 200);

        // Upload file
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = (await response.json()) as UploadResponse;
          const errorMsg = errorData.error || 'Upload failed';
          setState({
            isLoading: false,
            progress: 0,
            error: errorMsg,
            success: false,
          });
          return { success: false, error: errorMsg };
        }

        const data = (await response.json()) as UploadResponse;

        if (!data.success) {
          const errorMsg = data.error || 'Upload failed';
          setState({
            isLoading: false,
            progress: 0,
            error: errorMsg,
            success: false,
          });
          return { success: false, error: errorMsg };
        }

        // Success
        setState({
          isLoading: false,
          progress: 100,
          error: null,
          success: true,
        });

        console.log('✅ [useImageUpload] Upload successful:', data.url);
        return data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('🚫 [useImageUpload] Upload error:', error);
        setState({
          isLoading: false,
          progress: 0,
          error: errorMsg,
          success: false,
        });
        return { success: false, error: errorMsg };
      }
    },
    [user]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      error: null,
      success: false,
    });
  }, []);

  return {
    upload,
    reset,
    isLoading: state.isLoading,
    progress: state.progress,
    error: state.error,
    success: state.success,
  };
}
