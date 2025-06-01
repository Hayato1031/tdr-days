/**
 * Hook for managing visits with CRUD operations and statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS, StorageError } from '../services/storage';
import {
  Visit,
  Companion,
  VisitFilter,
  VisitStats,
  DateRange,
  ParkType,
  TimelineAction,
  CreateInput,
  UpdateInput,
} from '../types/models';

interface UseVisitsReturn {
  // Data
  visits: Visit[];
  companions: Companion[];
  isLoading: boolean;
  error: StorageError | null;

  // CRUD operations
  createVisit: (visit: CreateInput<Visit>) => Promise<Visit>;
  updateVisit: (id: string, updates: UpdateInput<Visit>) => Promise<Visit | null>;
  deleteVisit: (id: string) => Promise<boolean>;
  getVisit: (id: string) => Promise<Visit | null>;

  // Companion operations
  createCompanion: (companion: CreateInput<Companion>) => Promise<Companion>;
  updateCompanion: (id: string, updates: UpdateInput<Companion>) => Promise<Companion | null>;
  deleteCompanion: (id: string) => Promise<boolean>;

  // Query operations
  getVisitsByDateRange: (dateRange: DateRange) => Promise<Visit[]>;
  getVisitsByCompanion: (companionId: string) => Promise<Visit[]>;
  getVisitsByPark: (parkType: ParkType) => Promise<Visit[]>;
  getFilteredVisits: (filter: VisitFilter) => Promise<Visit[]>;

  // Statistics
  getVisitStatistics: (filter?: VisitFilter) => Promise<VisitStats>;
  getCompanionVisitCount: (companionId: string) => Promise<number>;

  // Utility
  refreshData: () => Promise<void>;
}

export function useVisits(): UseVisitsReturn {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [visitsData, companionsData] = await Promise.all([
        storage.getAll<Visit>(STORAGE_KEYS.VISITS),
        storage.getAll<Companion>(STORAGE_KEYS.COMPANIONS),
      ]);
      setVisits(visitsData);
      setCompanions(companionsData);
    } catch (err) {
      setError(err as StorageError);
      // Still set empty arrays on error
      setVisits([]);
      setCompanions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Visit CRUD operations
  const createVisit = useCallback(async (visitData: CreateInput<Visit>): Promise<Visit> => {
    try {
      const newVisit = await storage.create<Visit>(STORAGE_KEYS.VISITS, visitData);
      
      // Update companion visit IDs
      if (visitData.companionIds?.length) {
        const updates = visitData.companionIds.map(companionId => {
          const companion = companions.find(c => c.id === companionId);
          if (companion) {
            return {
              id: companionId,
              data: { visitIds: [...(companion.visitIds || []), newVisit.id] },
            };
          }
          return null;
        }).filter(Boolean) as Array<{ id: string; data: Partial<Companion> }>;

        if (updates.length > 0) {
          await storage.updateMany<Companion>(STORAGE_KEYS.COMPANIONS, updates);
        }
      }

      await loadData();
      return newVisit;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [companions]);

  const updateVisit = useCallback(async (
    id: string,
    updates: UpdateInput<Visit>
  ): Promise<Visit | null> => {
    try {
      const currentVisit = await storage.get<Visit>(STORAGE_KEYS.VISITS, id);
      if (!currentVisit) return null;

      // Handle companion changes
      if (updates.companionIds && 
          JSON.stringify(updates.companionIds) !== JSON.stringify(currentVisit.companionIds)) {
        // Remove visit ID from old companions
        const oldCompanionUpdates = currentVisit.companionIds.map(companionId => ({
          id: companionId,
          data: {
            visitIds: companions.find(c => c.id === companionId)?.visitIds.filter(vid => vid !== id) || [],
          },
        }));

        // Add visit ID to new companions
        const newCompanionUpdates = updates.companionIds
          .filter(cId => !currentVisit.companionIds.includes(cId))
          .map(companionId => {
            const companion = companions.find(c => c.id === companionId);
            return {
              id: companionId,
              data: { visitIds: [...(companion?.visitIds || []), id] },
            };
          });

        const allUpdates = [...oldCompanionUpdates, ...newCompanionUpdates];
        if (allUpdates.length > 0) {
          await storage.updateMany<Companion>(STORAGE_KEYS.COMPANIONS, allUpdates);
        }
      }

      const updatedVisit = await storage.update<Visit>(STORAGE_KEYS.VISITS, id, updates);
      await loadData();
      return updatedVisit;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [companions]);

  const deleteVisit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const visit = await storage.get<Visit>(STORAGE_KEYS.VISITS, id);
      if (!visit) return false;

      // Remove visit ID from companions
      if (visit.companionIds?.length) {
        const updates = visit.companionIds.map(companionId => {
          const companion = companions.find(c => c.id === companionId);
          if (companion) {
            return {
              id: companionId,
              data: { visitIds: companion.visitIds.filter(vid => vid !== id) },
            };
          }
          return null;
        }).filter(Boolean) as Array<{ id: string; data: Partial<Companion> }>;

        if (updates.length > 0) {
          await storage.updateMany<Companion>(STORAGE_KEYS.COMPANIONS, updates);
        }
      }

      // Delete all actions for this visit
      const actions = await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => action.visitId === id
      );
      if (actions.length > 0) {
        await storage.deleteMany(STORAGE_KEYS.ACTIONS, actions.map(a => a.id));
      }

      const result = await storage.delete<Visit>(STORAGE_KEYS.VISITS, id);
      await loadData();
      return result;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [companions]);

  const getVisit = useCallback(async (id: string): Promise<Visit | null> => {
    try {
      return await storage.get<Visit>(STORAGE_KEYS.VISITS, id);
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  // Companion operations
  const createCompanion = useCallback(async (
    companionData: CreateInput<Companion>
  ): Promise<Companion> => {
    try {
      const newCompanion = await storage.create<Companion>(
        STORAGE_KEYS.COMPANIONS,
        { ...companionData, visitIds: companionData.visitIds || [] }
      );
      await loadData();
      return newCompanion;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const updateCompanion = useCallback(async (
    id: string,
    updates: UpdateInput<Companion>
  ): Promise<Companion | null> => {
    try {
      const updatedCompanion = await storage.update<Companion>(
        STORAGE_KEYS.COMPANIONS,
        id,
        updates
      );
      await loadData();
      return updatedCompanion;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const deleteCompanion = useCallback(async (id: string): Promise<boolean> => {
    try {
      const companion = await storage.get<Companion>(STORAGE_KEYS.COMPANIONS, id);
      if (!companion) return false;

      // Remove companion from all visits
      if (companion.visitIds?.length) {
        const visitUpdates = companion.visitIds.map(visitId => {
          const visit = visits.find(v => v.id === visitId);
          if (visit) {
            return {
              id: visitId,
              data: { companionIds: visit.companionIds.filter(cId => cId !== id) },
            };
          }
          return null;
        }).filter(Boolean) as Array<{ id: string; data: Partial<Visit> }>;

        if (visitUpdates.length > 0) {
          await storage.updateMany<Visit>(STORAGE_KEYS.VISITS, visitUpdates);
        }
      }

      const result = await storage.delete<Companion>(STORAGE_KEYS.COMPANIONS, id);
      await loadData();
      return result;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [visits]);

  // Query operations
  const getVisitsByDateRange = useCallback(async (
    dateRange: DateRange
  ): Promise<Visit[]> => {
    try {
      return await storage.find<Visit>(
        STORAGE_KEYS.VISITS,
        visit => {
          const visitDate = new Date(visit.date);
          return visitDate >= dateRange.startDate && visitDate <= dateRange.endDate;
        }
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getVisitsByCompanion = useCallback(async (companionId: string): Promise<Visit[]> => {
    try {
      return await storage.find<Visit>(
        STORAGE_KEYS.VISITS,
        visit => visit.companionIds.includes(companionId)
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getVisitsByPark = useCallback(async (parkType: ParkType): Promise<Visit[]> => {
    try {
      return await storage.find<Visit>(
        STORAGE_KEYS.VISITS,
        visit => visit.parkType === parkType
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getFilteredVisits = useCallback(async (filter: VisitFilter): Promise<Visit[]> => {
    try {
      return await storage.find<Visit>(
        STORAGE_KEYS.VISITS,
        visit => {
          if (filter.parkType && visit.parkType !== filter.parkType) return false;
          
          if (filter.dateRange) {
            const visitDate = new Date(visit.date);
            if (visitDate < filter.dateRange.startDate || visitDate > filter.dateRange.endDate) {
              return false;
            }
          }
          
          if (filter.companionIds?.length) {
            const hasCompanion = filter.companionIds.some(cId => 
              visit.companionIds.includes(cId)
            );
            if (!hasCompanion) return false;
          }
          
          return true;
        }
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  // Statistics
  const getVisitStatistics = useCallback(async (
    filter?: VisitFilter
  ): Promise<VisitStats> => {
    try {
      const filteredVisits = filter 
        ? await getFilteredVisits(filter)
        : await storage.getAll<Visit>(STORAGE_KEYS.VISITS);

      const landVisits = filteredVisits.filter(v => v.parkType === ParkType.LAND);
      const seaVisits = filteredVisits.filter(v => v.parkType === ParkType.SEA);

      // Calculate average visit duration
      let totalDuration = 0;
      let durationCount = 0;
      filteredVisits.forEach(visit => {
        if (visit.startTime && visit.endTime) {
          const duration = new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime();
          totalDuration += duration;
          durationCount++;
        }
      });
      const averageVisitDuration = durationCount > 0 
        ? totalDuration / durationCount / (1000 * 60) // Convert to minutes
        : undefined;

      // Calculate companion statistics
      const companionStats = new Map<string, number>();
      filteredVisits.forEach(visit => {
        visit.companionIds.forEach(companionId => {
          companionStats.set(companionId, (companionStats.get(companionId) || 0) + 1);
        });
      });

      const favoriteCompanions = await Promise.all(
        Array.from(companionStats.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(async ([companionId, count]) => {
            const companion = await storage.get<Companion>(STORAGE_KEYS.COMPANIONS, companionId);
            return companion ? { companion, visitCount: count } : null;
          })
      ).then(results => results.filter(Boolean) as Array<{ companion: Companion; visitCount: number }>);

      // Calculate visits by month
      const visitsByMonthMap = new Map<string, number>();
      filteredVisits.forEach(visit => {
        const date = new Date(visit.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        visitsByMonthMap.set(monthKey, (visitsByMonthMap.get(monthKey) || 0) + 1);
      });
      const visitsByMonth = Array.from(visitsByMonthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate visits by year
      const visitsByYearMap = new Map<number, number>();
      filteredVisits.forEach(visit => {
        const year = new Date(visit.date).getFullYear();
        visitsByYearMap.set(year, (visitsByYearMap.get(year) || 0) + 1);
      });
      const visitsByYear = Array.from(visitsByYearMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);

      return {
        totalVisits: filteredVisits.length,
        landVisits: landVisits.length,
        seaVisits: seaVisits.length,
        averageVisitDuration,
        favoriteCompanions,
        visitsByMonth,
        visitsByYear,
      };
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [getFilteredVisits]);

  const getCompanionVisitCount = useCallback(async (companionId: string): Promise<number> => {
    try {
      const companion = await storage.get<Companion>(STORAGE_KEYS.COMPANIONS, companionId);
      return companion?.visitIds.length || 0;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  return {
    // Data
    visits,
    companions,
    isLoading,
    error,

    // CRUD operations
    createVisit,
    updateVisit,
    deleteVisit,
    getVisit,

    // Companion operations
    createCompanion,
    updateCompanion,
    deleteCompanion,

    // Query operations
    getVisitsByDateRange,
    getVisitsByCompanion,
    getVisitsByPark,
    getFilteredVisits,

    // Statistics
    getVisitStatistics,
    getCompanionVisitCount,

    // Utility
    refreshData,
  };
}