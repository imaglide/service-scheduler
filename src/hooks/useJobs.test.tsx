import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useJobs } from './useJobs';
import { supabase } from '../lib/supabaseClient';

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useJobs', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockJobs = [
    {
      id: 'job1',
      title: 'Install AC',
      description: 'Description 1',
      status: 'scheduled',
      start_time: '2024-01-01T08:00:00Z',
      end_time: '2024-01-01T17:00:00Z',
      assignments: [
        {
          id: 'assign1',
          job_id: 'job1',
          staff_id: 'staff1',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T10:00:00Z',
        },
        {
          id: 'assign2',
          job_id: 'job1',
          staff_id: 'staff2',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T11:00:00Z',
        },
      ],
    },
    {
      id: 'job2',
      title: 'Fix Faucet',
      description: 'Description 2',
      status: 'unscheduled',
      start_time: '2024-01-02T08:00:00Z',
      end_time: '2024-01-02T17:00:00Z',
      assignments: [],
    },
  ];

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('loads jobs with their assignments and correct shape', async () => {
    // Mock Supabase response
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn(() => ({
        data: mockJobs,
        error: null,
      })),
    }));

    const { result } = renderHook(() => useJobs(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // The data should be an array of jobs with nested assignments
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      id: 'job1',
      title: 'Install AC',
      description: 'Description 1',
      status: 'scheduled',
      start_time: '2024-01-01T08:00:00Z',
      end_time: '2024-01-01T17:00:00Z',
      assignments: [
        expect.objectContaining({
          id: 'assign1',
          job_id: 'job1',
          staff_id: 'staff1',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T10:00:00Z',
        }),
        expect.objectContaining({
          id: 'assign2',
          job_id: 'job1',
          staff_id: 'staff2',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T11:00:00Z',
        }),
      ],
    });
    expect(result.current.data?.[1]).toMatchObject({
      id: 'job2',
      title: 'Fix Faucet',
      description: 'Description 2',
      status: 'unscheduled',
      start_time: '2024-01-02T08:00:00Z',
      end_time: '2024-01-02T17:00:00Z',
      assignments: [],
    });
  });
}); 