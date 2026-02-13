import { useState, useCallback } from 'react';
import { checkConflicts } from '@/api/grpc/appointment.client';
import type { ConflictInfo } from '@/types/appointment';

export function useConflictDetection() {
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo | null>(null);

  const checkForConflicts = useCallback(
    async (userId: string, startTime: string, endTime: string, excludeId?: string) => {
      setChecking(true);
      setConflicts(null);

      try {
        const response = await checkConflicts({
          userId,
          startTime,
          endTime,
          excludeId,
        });

        if (response.conflicts && response.conflicts.conflictingAppointments.length > 0) {
          setConflicts(response.conflicts);
          return response.conflicts;
        }

        return null;
      } catch (error) {
        console.error('Failed to check conflicts:', error);
        return null;
      } finally {
        setChecking(false);
      }
    },
    []
  );

  const clearConflicts = useCallback(() => {
    setConflicts(null);
  }, []);

  return {
    checking,
    conflicts,
    checkForConflicts,
    clearConflicts,
  };
}
