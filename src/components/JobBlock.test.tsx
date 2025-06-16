import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JobBlock from './JobBlock';
import React from 'react';
import { Job, Staff, Assignment } from '../types/scheduler';

describe('JobBlock', () => {
  const job: Job = {
    id: '1',
    title: 'Test Job',
    description: 'Test job description',
    status: 'scheduled',
    start_time: '2024-01-01T09:00:00Z',
    end_time: '2024-01-01T10:00:00Z',
  };
  const assignment: Assignment = {
    id: 'assign1',
    job_id: 'job1',
    staff_id: 'staff1',
    start_time: '2024-01-01T09:00:00Z',
    end_time: '2024-01-01T10:00:00Z',
  };
  const staff: Staff[] = [
    { id: 'staff1', name: 'Alice' },
    { id: 'staff2', name: 'Bob' },
  ];
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00',
  ];

  it('renders job title and staff name', () => {
    render(
      <JobBlock
        job={job}
        assignment={assignment}
        staff={staff}
        onClick={() => {}}
        timeSlots={timeSlots}
      />
    );
    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('applies preview styling when isPreview is true', () => {
    render(
      <JobBlock
        job={job}
        assignment={assignment}
        staff={staff}
        onClick={() => {}}
        timeSlots={timeSlots}
        isPreview={true}
      />
    );
    const box = screen.getByRole('button');
    // Preview styling: bg should be blue.200 and opacity 0.6
    expect(box).toHaveStyle({
      background: 'blue.200',
      opacity: '0.6',
    });
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(
      <JobBlock
        job={job}
        assignment={assignment}
        staff={staff}
        onClick={handleClick}
        timeSlots={timeSlots}
      />
    );
    const box = screen.getByRole('button');
    fireEvent.click(box);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
}); 