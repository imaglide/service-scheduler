import React, { useRef, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useDrag } from 'react-dnd';
import { Job, Staff, Assignment } from '../types/scheduler';

interface JobBlockProps {
  job: Job;
  assignment: Assignment;
  staff: Staff[];
  onClick: () => void;
  timeSlots: string[];
  isPreview?: boolean;
  'data-testid'?: string;
}

function getTimeSlotIndex(time: string, timeSlots: string[]): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 8 * 60; // 8 AM in minutes
  return Math.floor((totalMinutes - startMinutes) / 30);
}

export default function JobBlock({ 
  job, 
  assignment, 
  staff, 
  onClick, 
  timeSlots, 
  isPreview = false,
  ...rest
}: JobBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'JOB',
    item: { 
      id: job.id,
      assignmentId: assignment.id 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isPreview,
  }));

  const startTime = new Date(assignment.start_time);
  const endTime = new Date(assignment.end_time);
  
  // Calculate position and width based on time slots
  const startIndex = getTimeSlotIndex(
    `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
    timeSlots
  );
  const endIndex = getTimeSlotIndex(
    `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
    timeSlots
  );
  const duration = endIndex - startIndex;

  const staffMember = staff.find((s) => s.id === assignment.staff_id);
  const staffIndex = staff.findIndex((s) => s.id === assignment.staff_id);

  // Keyboard accessibility
  const boxRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isPreview) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <>
      <Box
        ref={isPreview ? undefined : drag as any}
        tabIndex={isPreview ? -1 : 0}
        position="absolute"
        left={`calc(200px + ${startIndex * 100}%)`}
        top={`${staffIndex * 60}px`}
        width={`${duration * 100}%`}
        height="50px"
        bg={isPreview ? 'blue.200' : isDragging ? 'blue.100' : 'blue.500'}
        color="white"
        p={2}
        borderRadius="md"
        cursor={isPreview ? 'default' : 'pointer'}
        onClick={isPreview ? undefined : onClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        opacity={isPreview ? 0.6 : isDragging ? 0.5 : 1}
        zIndex={isPreview ? 1 : 2}
        boxShadow="sm"
        _hover={isPreview ? undefined : { boxShadow: 'md' }}
        pointerEvents={isPreview ? 'none' : 'auto'}
        role="button"
        aria-label={`Job: ${job.title}, Staff: ${staffMember?.name || 'Unassigned'}, ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        {...rest}
      >
        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
          {job.title}
        </Text>
        <Text fontSize="xs" noOfLines={1}>
          {staffMember?.name}
        </Text>
      </Box>
      
      {showTooltip && (
        <Box
          position="absolute"
          left={`calc(200px + ${startIndex * 100}%)`}
          top={`${staffIndex * 60 - 80}px`}
          bg="white"
          color="black"
          p={2}
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
          width="auto"
          minW="150px"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="bold" fontSize="sm">
            {job.title}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {staffMember?.name || 'Unassigned'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Box>
      )}
    </>
  );
} 