import React from 'react';
import { ChakraProvider, Box, Grid } from '@chakra-ui/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchedulerGrid from './components/SchedulerGrid';
import Sidebar from './components/Sidebar';
import { Job, Assignment, JobWithAssignments } from './types/scheduler';

// Create a client
const queryClient = new QueryClient();

// Mock data for initial development
const mockJobs: JobWithAssignments[] = [
  {
    id: '1',
    title: 'Install New AC',
    description: 'Install new air conditioning unit in living room',
    start_time: '2024-03-20T09:00:00Z',
    end_time: '2024-03-20T11:00:00Z',
    status: 'scheduled',
    assignments: [
      {
        id: 'assign1',
        job_id: '1',
        staff_id: '1',
        start_time: '2024-03-20T09:00:00Z',
        end_time: '2024-03-20T11:00:00Z',
      }
    ]
  },
  {
    id: '2',
    title: 'Fix Leaky Faucet',
    description: 'Repair kitchen sink faucet',
    start_time: '2024-03-20T13:00:00Z',
    end_time: '2024-03-20T14:00:00Z',
    status: 'scheduled',
    assignments: [
      {
        id: 'assign2',
        job_id: '2',
        staff_id: '2',
        start_time: '2024-03-20T13:00:00Z',
        end_time: '2024-03-20T14:00:00Z',
      }
    ]
  },
];

const mockStaff = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Sarah Johnson' },
];

function App() {
  const handleJobClick = (job: JobWithAssignments) => {
    console.log('Job clicked:', job);
    // TODO: Implement job click handler
  };

  const handleJobMove = (assignmentId: string, newStaffId: string, newStartTime: string, newEndTime: string) => {
    console.log('Job moved:', { assignmentId, newStaffId, newStartTime, newEndTime });
    // TODO: Implement job move handler
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <DndProvider backend={HTML5Backend}>
          <Box p={4} data-testid="scheduler-app">
            <Grid templateColumns="250px 1fr" gap={4}>
              <Sidebar jobs={mockJobs} onJobClick={handleJobClick} />
              <SchedulerGrid 
                jobs={mockJobs} 
                staff={mockStaff} 
                onJobMove={handleJobMove}
              />
            </Grid>
          </Box>
        </DndProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App; 