import { useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import type { PublicTable } from '../lib/types';

interface AvailabilityCheck {
  available: boolean;
  tables: PublicTable[];
  suggestedSlots?: Array<{
    time: string;
    availableSeats: number;
  }>;
  message?: string;
}

export function useAvailabilityCheck() {
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(async (date: string, time: string, partySize: number) => {
    if (!date || !time || partySize < 1) {
      setAvailability(null);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setChecking(true);
    try {
      const response = await api.post('/api/public/check-availability', {
        date,
        time,
        party_size: partySize,
      }, { signal: controller.signal });

      setAvailability(response.data);
    } catch (error) {
      // Don't update state if request was aborted (superseded by newer request)
      if (controller.signal.aborted) return;
      setAvailability({
        available: false,
        tables: [],
        message: 'Erreur lors de la vérification',
      });
    } finally {
      if (!controller.signal.aborted) {
        setChecking(false);
      }
    }
  }, []);

  return { availability, checking, checkAvailability };
}
