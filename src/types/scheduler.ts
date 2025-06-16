export interface Staff {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'unscheduled';
  start_time: string;
  end_time: string;
}

export interface Assignment {
  id: string;
  job_id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
}

export interface JobWithAssignments extends Job {
  assignments: Assignment[];
} 