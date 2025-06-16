import React from 'react';
import { Box, Grid, GridItem, useDisclosure, useToast, Text } from '@chakra-ui/react';
import { useState } from 'react';
import JobModal from './JobModal';
import { Job, Staff, Assignment, JobWithAssignments } from '../types/scheduler';

// Generate time slots from 8 AM to 6 PM in 30-minute intervals
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor((i + 16) / 2); // Start from 8 AM (16 half-hours)
  const minute = (i + 16) % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

const GRID_TEMPLATE_COLUMNS = `200px repeat(${TIME_SLOTS.length}, 1fr)`;

function snapToGrid(date: Date): Date {
  const ms = 1000 * 60 * 30; // 30 minutes in milliseconds
  return new Date(Math.round(date.getTime() / ms) * ms);
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
    // Skip assignments for other staff members
    if (assignment.staff_id !== staffId) return false;
    
    const jobStart = new Date(assignment.start_time);
    const jobEnd = new Date(assignment.end_time);
    
    // Check if the new time range overlaps with the existing assignment
    return (
      (newStart >= jobStart && newStart < jobEnd) || // New start time falls within existing job
      (newEnd > jobStart && newEnd <= jobEnd) || // New end time falls within existing job
      (newStart <= jobStart && newEnd >= jobEnd) // New job completely encompasses existing job
    );
  });
}

interface SchedulerGridProps {
  jobs: JobWithAssignments[];
  staff: Staff[];
  onJobMove: (assignmentId: string, newStaffId: string, newStartTime: string, newEndTime: string) => void;
}

interface JobBlockProps {
  job: JobWithAssignments;
  assignment: Assignment;
  onClick: () => void;
  style?: React.CSSProperties;
  key?: string;
  'data-testid'?: string;
}

function JobBlock({ job, assignment, onClick, style, key, 'data-testid': testId }: JobBlockProps) {
  const startTime = new Date(assignment.start_time);
  const endTime = new Date(assignment.end_time);
  const startIndex = getTimeSlotIndex(startTime.toTimeString().slice(0, 5));
  const endIndex = getTimeSlotIndex(endTime.toTimeString().slice(0, 5));
  const duration = endIndex - startIndex;

  return (
    <Box
      position="absolute"
      left={`${(startIndex / TIME_SLOTS.length) * 100}%`}
      width={`${(duration / TIME_SLOTS.length) * 100}%`}
      height="100%"
      bg="blue.100"
      border="1px solid"
      borderColor="blue.300"
      borderRadius="md"
      p={2}
      cursor="pointer"
      onClick={onClick}
      style={style}
    >
      <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
        {job.title}
      </Text>
      <Text fontSize="xs" color="gray.600" noOfLines={1}>
        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
        {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Box>
  );
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
              _after={{
                content: '""',
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '1px',
                bg: 'gray.200',
              }}
              data-testid={`time-slot-${timeSlot}`}
            >
              {jobs.map((job) => {
                const assignment = job.assignments.find(
                  (a) => a.staff_id === staffMember.id && 
                  getTimeSlotIndex(a.start_time.split('T')[1].slice(0, 5)) <= getTimeSlotIndex(timeSlot) &&
                  getTimeSlotIndex(a.end_time.split('T')[1].slice(0, 5)) > getTimeSlotIndex(timeSlot)
                );

                if (assignment) {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <JobBlock
                      key={assignment.id}
                      job={job}
                      assignment={assignment}
                      onClick={() => handleAssignmentClick(job)}
                      style={{
                        border: isSelected ? '2px solid' : '1px solid',
                        borderColor: isSelected ? 'blue.500' : 'gray.200',
                        boxShadow: isSelected ? '0 0 0 2px rgba(66, 153, 225, 0.2)' : 'none',
                        zIndex: isSelected ? 1 : 0,
                      }}
                      data-testid={`job-block-${assignment.id}`}
                    />
                  );
                }
                return null;
              })}
            </GridItem>
          ))}
        </Grid>
      ))}

      {/* Job blocks */}
      {jobs
        .filter((job) => job.status === 'scheduled')
        .flatMap((job) =>
          job.assignments.map((assignment) => (
            <JobBlock
              key={assignment.id}
              job={job}
              assignment={assignment}
              onClick={() => handleJobClick(job)}
              data-testid={`job-block-${assignment.id}`}
            />
          ))
        )}

      {/* Drag preview */}
      {dragPreview && (
        <JobBlock
          job={dragPreview.job}
          assignment={dragPreview.assignment}
          onClick={() => {}}
          data-testid={`job-block-${dragPreview.assignment.id}`}
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