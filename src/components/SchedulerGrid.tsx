import React, { useState } from 'react';
import { Box, Grid, GridItem, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { JobWithAssignments, Staff, Assignment } from '../types/scheduler';
import JobModal from './JobModal';
import JobBlock from './JobBlock';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];

const GRID_TEMPLATE_COLUMNS = '200px repeat(19, 1fr)';

function snapToGrid(date: Date): Date {
  const minutes = date.getMinutes();
  const snappedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 60;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), snappedMinutes % 60);
}

function getTimeSlotIndex(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 8 * 60; // 8 AM in minutes
  return Math.floor((totalMinutes - startMinutes) / 30);
}

function hasOverlap(
  newStart: Date,
  newEnd: Date,
  existingAssignments: Assignment[],
  staffId: string
): boolean {
  return existingAssignments.some(assignment => {
    if (assignment.staff_id !== staffId) return false;
    
    const assignmentStart = new Date(assignment.start_time);
    const assignmentEnd = new Date(assignment.end_time);
    
    return (
      (newStart >= assignmentStart && newStart < assignmentEnd) ||
      (newEnd > assignmentStart && newEnd <= assignmentEnd) ||
      (newStart <= assignmentStart && newEnd >= assignmentEnd)
    );
  });
}

interface SchedulerGridProps {
  jobs: JobWithAssignments[];
  staff: Staff[];
  onJobMove: (assignmentId: string, newStaffId: string, newStartTime: string, newEndTime: string) => void;
}

export default function SchedulerGrid({ jobs, staff, onJobMove }: SchedulerGridProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJob, setSelectedJob] = useState<JobWithAssignments | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    job: JobWithAssignments;
    assignment: Assignment;
    staffId: string;
    timeSlot: string;
  } | null>(null);
  const toast = useToast();

  const handleJobClick = (job: JobWithAssignments) => {
    setSelectedJob(job);
    onOpen();
  };

  const handleAssignmentClick = (job: JobWithAssignments) => {
    setSelectedJob(job);
    onOpen();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, staffId: string, timeSlot: string) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');
    const assignmentId = e.dataTransfer.getData('assignmentId');
    const job = jobs.find(j => j.id === jobId);
    const assignment = job?.assignments.find(a => a.id === assignmentId);
    
    if (!job || !assignment) return;

    // Calculate preview position
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const newStartTime = new Date();
    newStartTime.setHours(hours, minutes, 0, 0);
    const snappedStartTime = snapToGrid(newStartTime);

    // Calculate original duration
    const originalStart = new Date(assignment.start_time);
    const originalEnd = new Date(assignment.end_time);
    const duration = originalEnd.getTime() - originalStart.getTime();
    const newEndTime = new Date(snappedStartTime.getTime() + duration);

    setDragPreview({
      job,
      assignment: {
        ...assignment,
        start_time: snappedStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        staff_id: staffId
      },
      staffId,
      timeSlot
    });
  };

  const handleDragLeave = () => {
    setDragPreview(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, staffId: string, timeSlot: string) => {
    e.preventDefault();
    setDragPreview(null);
    const jobId = e.dataTransfer.getData('jobId');
    const assignmentId = e.dataTransfer.getData('assignmentId');
    const job = jobs.find(j => j.id === jobId);
    const assignment = job?.assignments.find(a => a.id === assignmentId);
    
    if (!job || !assignment) return;

    // Calculate new start time
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const newStartTime = new Date();
    newStartTime.setHours(hours, minutes, 0, 0);
    const snappedStartTime = snapToGrid(newStartTime);

    // Check if the snapped time is in the past
    const now = new Date();
    if (snappedStartTime < now) {
      toast({
        title: 'Cannot schedule in the past',
        description: 'Please select a time slot in the future',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Calculate original duration
    const originalStart = new Date(assignment.start_time);
    const originalEnd = new Date(assignment.end_time);
    const duration = originalEnd.getTime() - originalStart.getTime();

    // Calculate new end time based on snapped start time and original duration
    const newEndTime = new Date(snappedStartTime.getTime() + duration);

    // Check for overlapping assignments
    const allAssignments = jobs.flatMap(j => j.assignments);
    if (hasOverlap(snappedStartTime, newEndTime, allAssignments, staffId)) {
      toast({
        title: 'Schedule conflict',
        description: 'This time slot overlaps with another job for this staff member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onJobMove(assignmentId, staffId, snappedStartTime.toISOString(), newEndTime.toISOString());
  };

  return (
    <Box position="relative" height="100vh" overflow="auto">
      <Grid
        templateColumns={GRID_TEMPLATE_COLUMNS}
        gap={0}
        position="sticky"
        top={0}
        bg="white"
        zIndex={1}
        borderBottom="2px"
        borderColor="gray.300"
      >
        {/* Header row with time slots */}
        <GridItem 
          colSpan={1} 
          borderBottom="1px" 
          borderRight="1px" 
          borderColor="gray.300" 
          p={2}
          bg="gray.50"
          fontWeight="bold"
        >
          Staff
        </GridItem>
        {TIME_SLOTS.map((timeSlot) => (
          <GridItem
            key={timeSlot}
            borderBottom="1px"
            borderRight="1px"
            borderColor="gray.300"
            p={2}
            textAlign="center"
            bg={timeSlot.endsWith(':30') ? 'gray.50' : 'white'}
            position="relative"
            _after={{
              content: '""',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '1px',
              bg: 'gray.200',
            }}
          >
            {timeSlot}
          </GridItem>
        ))}
      </Grid>

      {/* Staff rows */}
      {staff.map((staffMember) => (
        <Grid
          key={staffMember.id}
          templateColumns={GRID_TEMPLATE_COLUMNS}
          gap={0}
          minH="60px"
          position="relative"
          data-testid={`staff-row-${staffMember.id}`}
        >
          <GridItem
            colSpan={1}
            borderBottom="1px"
            borderRight="1px"
            borderColor="gray.300"
            p={2}
            bg="gray.50"
          >
            {staffMember.name}
          </GridItem>
          {TIME_SLOTS.map((timeSlot) => (
            <GridItem
              key={timeSlot}
              borderBottom="1px"
              borderRight="1px"
              borderColor="gray.300"
              bg={timeSlot.endsWith(':30') ? 'gray.50' : 'white'}
              onDragOver={(e) => handleDragOver(e, staffMember.id, timeSlot)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, staffMember.id, timeSlot)}
              position="relative"
              pointerEvents="none"
              _after={{
                content: '""',
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '1px',
                bg: 'gray.200',
                pointerEvents: 'none',
              }}
              data-testid={`time-slot-${timeSlot}`}
              sx={{
                '&[data-drag-over="true"]': {
                  pointerEvents: 'auto',
                },
              }}
            >
              {/* JobBlocks are rendered separately below */}
            </GridItem>
          ))}
        </Grid>
      ))}

      {/* Job blocks - render all job blocks here to avoid duplication */}
      {jobs
        .filter((job) => job.status === 'scheduled')
        .flatMap((job) =>
          job.assignments.map((assignment) => (
            <JobBlock
              key={assignment.id}
              job={job}
              assignment={assignment}
              staff={staff}
              timeSlots={TIME_SLOTS}
              onClick={() => handleJobClick(job)}
            />
          ))
        )}

      {/* Drag preview */}
      {dragPreview && (
        <JobBlock
          job={dragPreview.job}
          assignment={dragPreview.assignment}
          staff={staff}
          timeSlots={TIME_SLOTS}
          onClick={() => {}}
          isPreview={true}
        />
      )}

      {/* Job Modal */}
      <JobModal
        isOpen={isOpen}
        onClose={onClose}
        job={selectedJob || jobs[0]}
        staff={staff}
      />
    </Box>
  );
} 