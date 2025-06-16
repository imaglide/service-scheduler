import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Assignment } from '../types/scheduler';

export function useAssignments() {
  const queryClient = useQueryClient();

  // Fetch all assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*');
      
      if (error) throw error;
      return data as Assignment[];
    },
  });

  // Create a new assignment
  const createAssignment = useMutation({
    mutationFn: async (newAssignment: Omit<Assignment, 'id'>) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert([newAssignment])
        .select()
        .single();
      
      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Update an existing assignment
  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Assignment> & { id: string }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Delete an assignment
  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Fetch assignments for a specific job
  const getJobAssignments = (jobId: string) => {
    return useQuery({
      queryKey: ['assignments', jobId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('job_id', jobId);
        
        if (error) throw error;
        return data as Assignment[];
      },
    });
  };

  // Fetch assignments for a specific staff member
  const getStaffAssignments = (staffId: string) => {
    return useQuery({
      queryKey: ['assignments', 'staff', staffId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('staff_id', staffId);
        
        if (error) throw error;
        return data as Assignment[];
      },
    });
  };

  return {
    assignments,
    isLoadingAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getJobAssignments,
    getStaffAssignments,
  };
} 