import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Job, Assignment, JobWithAssignments } from '../types/scheduler';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      // Fetch jobs with assignments and staff info
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          status,
          start_time,
          end_time,
          assignments:assignments(
            id,
            job_id,
            staff_id,
            start_time,
            end_time,
            staff:staff(
              id,
              name
            )
          )
        `);

      if (error) throw error;
      if (!data) return [];

      // Map jobs to JobWithAssignments
      return data.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        start_time: job.start_time,
        end_time: job.end_time,
        assignments: (job.assignments || []).map((a: any) => ({
          id: a.id,
          job_id: a.job_id,
          staff_id: a.staff_id,
          start_time: a.start_time,
          end_time: a.end_time,
        })),
      }));
    }
  });
} 