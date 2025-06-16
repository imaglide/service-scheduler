import React from 'react';
import { Box, VStack, Text, useColorModeValue, Badge } from '@chakra-ui/react';
import { useDrag } from 'react-dnd';
import { Job, Assignment, JobWithAssignments } from '../types/scheduler';

interface SidebarProps {
  jobs: JobWithAssignments[];
  onJobClick: (job: JobWithAssignments) => void;
}

export default function Sidebar({ jobs, onJobClick }: SidebarProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width="200px"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      p={4}
      overflowY="auto"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Unscheduled Jobs
      </Text>
      <VStack spacing={2} align="stretch">
        {jobs.map((job) => (
          <DraggableJobCard key={job.id} job={job} onClick={() => onJobClick(job)} />
        ))}
      </VStack>
    </Box>
  );
}

interface DraggableJobCardProps {
  job: JobWithAssignments;
  onClick: () => void;
  key?: string;
}

function DraggableJobCard({ job, onClick }: DraggableJobCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'JOB',
    item: { id: job.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const assignmentCount = job.assignments?.length || 0;
  const badgeColor = assignmentCount === 0 ? 'gray' : assignmentCount === 1 ? 'blue' : 'green';

  return (
    <Box
      ref={drag as any}
      p={3}
      bg="white"
      borderRadius="md"
      boxShadow="sm"
      cursor="move"
      opacity={isDragging ? 0.5 : 1}
      onClick={onClick}
      _hover={{ boxShadow: 'md' }}
      position="relative"
      data-testid="sidebar-job-card"
    >
      <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
        {job.title}
      </Text>
      <Text fontSize="xs" color="gray.600" noOfLines={2}>
        {job.description}
      </Text>
      <Badge
        colorScheme={badgeColor}
        position="absolute"
        top={2}
        right={2}
        fontSize="xs"
      >
        {assignmentCount} staff
      </Badge>
    </Box>
  );
} 