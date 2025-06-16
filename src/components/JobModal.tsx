import React, { useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  VStack,
  useToast,
  Box,
  Text,
  IconButton,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Job, Staff, Assignment, JobWithAssignments } from '../types/scheduler';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobWithAssignments;
  staff: Staff[];
  onSave?: (updatedJob: JobWithAssignments, assignments: Assignment[]) => void;
}

export default function JobModal({ isOpen, onClose, job, staff, onSave }: JobModalProps) {
  const [editedJob, setEditedJob] = useState<JobWithAssignments>(job);
  const [assignments, setAssignments] = useState<Assignment[]>(job.assignments || []);
  const toast = useToast();

  useEffect(() => {
    // Check for overlapping assignments
    const hasOverlap = assignments.some((assignment, index) => {
      const assignmentStart = new Date(assignment.start_time);
      const assignmentEnd = new Date(assignment.end_time);
      
      return assignments.some((otherAssignment, otherIndex) => {
        if (index === otherIndex || assignment.staff_id !== otherAssignment.staff_id) return false;
        
        const otherStart = new Date(otherAssignment.start_time);
        const otherEnd = new Date(otherAssignment.end_time);
        
        return (
          (assignmentStart >= otherStart && assignmentStart < otherEnd) ||
          (assignmentEnd > otherStart && assignmentEnd <= otherEnd) ||
          (assignmentStart <= otherStart && assignmentEnd >= otherEnd)
        );
      });
    });

    if (hasOverlap) {
      toast({
        title: 'Schedule conflict detected',
        description: 'Some assignments overlap for the same staff member',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [assignments, toast]);

  const handleSave = () => {
    if (onSave) {
      onSave(editedJob, assignments);
      toast({
        title: 'Job updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    onClose();
  };

  const addAssignment = () => {
    const newAssignment: Assignment = {
      id: `temp-${Date.now()}`,
      job_id: job.id,
      staff_id: '',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    };
    setAssignments([...assignments, newAssignment]);
  };

  const removeAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  const updateAssignment = (assignmentId: string, updates: Partial<Assignment>) => {
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, ...updates } : a
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Job Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <HStack width="full" justify="space-between" align="center">
              <Text fontWeight="bold">Assignment Summary</Text>
              <Badge colorScheme="blue" fontSize="md">
                {assignments.length} staff member{assignments.length !== 1 ? 's' : ''} assigned
              </Badge>
            </HStack>

            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input
                value={editedJob.title}
                onChange={(e) =>
                  setEditedJob({ ...editedJob, title: e.target.value })
                }
                data-testid="job-title"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={editedJob.description}
                onChange={(e) =>
                  setEditedJob({ ...editedJob, description: e.target.value })
                }
              />
            </FormControl>

            <Box width="full">
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">Assignments</Text>
                <HStack>
                  <Button size="sm" onClick={addAssignment}>
                    Add Assignment
                  </Button>
                  <Button size="sm" colorScheme="blue" variant="outline" onClick={() => {
                    // Assign all staff
                    const now = new Date();
                    const oneHourLater = new Date(now.getTime() + 3600000);
                    const newAssignments = staff.map((member) => ({
                      id: `temp-${member.id}-${Date.now()}`,
                      job_id: job.id,
                      staff_id: member.id,
                      start_time: now.toISOString(),
                      end_time: oneHourLater.toISOString(),
                    }));
                    setAssignments(newAssignments);
                    toast({
                      title: `Job assigned to all staff`,
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}>
                    Assign All Staff
                  </Button>
                  <Button size="sm" colorScheme="red" variant="outline" onClick={() => {
                    setAssignments([]);
                    toast({
                      title: `Job unassigned from all staff`,
                      status: 'info',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}>
                    Clear Assignments
                  </Button>
                </HStack>
              </HStack>

              <VStack spacing={4} align="stretch">
                {assignments.map((assignment, idx) => (
                  <Box
                    key={assignment.id}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    position="relative"
                  >
                    <IconButton
                      aria-label="Remove assignment"
                      icon={<Text>×</Text>}
                      size="sm"
                      position="absolute"
                      top={2}
                      right={2}
                      onClick={() => removeAssignment(assignment.id)}
                    />

                    <VStack spacing={3}>
                      <FormControl>
                        <FormLabel>Staff Member</FormLabel>
                        <Select
                          value={assignment.staff_id}
                          onChange={(e) =>
                            updateAssignment(assignment.id, { staff_id: e.target.value })
                          }
                          data-testid={`assigned-staff-${idx}`}
                        >
                          <option value="">Select staff member</option>
                          {staff.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Start Time</FormLabel>
                        <Input
                          type="datetime-local"
                          value={new Date(assignment.start_time).toISOString().slice(0, 16)}
                          onChange={(e) =>
                            updateAssignment(assignment.id, {
                              start_time: new Date(e.target.value).toISOString(),
                            })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>End Time</FormLabel>
                        <Input
                          type="datetime-local"
                          value={new Date(assignment.end_time).toISOString().slice(0, 16)}
                          onChange={(e) =>
                            updateAssignment(assignment.id, {
                              end_time: new Date(e.target.value).toISOString(),
                            })
                          }
                        />
                      </FormControl>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Button colorScheme="blue" onClick={handleSave} width="full">
              Save Changes
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 