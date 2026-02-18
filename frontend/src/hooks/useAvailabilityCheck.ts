import { useState, useCallback } from 'react';
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

  const checkAvailability = useCallback(async (date: string, time: string, partySize: number) => {
    if (!date || !time || partySize < 1) {
      setAvailability(null);
      return;
    }

    setChecking(true);
    try {
      const response = await api.post('/api/public/check-availability', {
        date,
        time,
        party_size: partySize,
      });
      
      setAvailability(response.data);
    } catch (error) {
      console.error('Availability check failed:', error);
      setAvailability({
        available: false,
        tables: [],
        message: 'Erreur lors de la vérification',
      });
    } finally {
      setChecking(false);
    }
  }, []);

  return { availability, checking, checkAvailability };
}
