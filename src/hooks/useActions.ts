/**
 * Hook for managing timeline actions with CRUD operations and filtering
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage, STORAGE_KEYS, StorageError } from '../services/storage';
import {
  TimelineAction,
  ActionFilter,
  ActionStats,
  ActionCategory,
  ParkArea,
  Visit,
  DateRange,
  SortOptions,
  CreateInput,
  UpdateInput,
  Photo,
} from '../types/models';

interface UseActionsReturn {
  // Data
  actions: TimelineAction[];
  isLoading: boolean;
  error: StorageError | null;

  // CRUD operations
  createAction: (action: CreateInput<TimelineAction>) => Promise<TimelineAction>;
  updateAction: (id: string, updates: UpdateInput<TimelineAction>) => Promise<TimelineAction | null>;
  deleteAction: (id: string) => Promise<boolean>;
  deleteAllActions: () => Promise<boolean>;
  getAction: (id: string) => Promise<TimelineAction | null>;

  // Batch operations
  createMultipleActions: (actions: CreateInput<TimelineAction>[]) => Promise<TimelineAction[]>;
  updateMultipleActions: (updates: Array<{ id: string; data: UpdateInput<TimelineAction> }>) => Promise<TimelineAction[]>;
  deleteMultipleActions: (ids: string[]) => Promise<number>;

  // Query operations
  getActionsByVisit: (visitId: string) => Promise<TimelineAction[]>;
  getActionsByCategory: (category: ActionCategory) => Promise<TimelineAction[]>;
  getActionsByArea: (area: ParkArea) => Promise<TimelineAction[]>;
  getActionsByDateRange: (dateRange: DateRange) => Promise<TimelineAction[]>;
  getFilteredActions: (filter: ActionFilter) => Promise<TimelineAction[]>;

  // Sorting and ordering
  sortActions: (actions: TimelineAction[], sortBy: SortOptions<TimelineAction>) => TimelineAction[];
  reorderActions: (visitId: string, actionIds: string[]) => Promise<void>;
  
  // Photo operations
  addPhotosToAction: (actionId: string, photos: Photo[]) => Promise<TimelineAction | null>;
  removePhotoFromAction: (actionId: string, photoId: string) => Promise<TimelineAction | null>;

  // Statistics
  getActionStatistics: (filter?: ActionFilter) => Promise<ActionStats>;
  getLocationVisitCount: (locationName: string) => Promise<number>;
  
  // Utility
  refreshData: () => Promise<void>;
}

export function useActions(): UseActionsReturn {
  const [actions, setActions] = useState<TimelineAction[]>([]);
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

      const actionsData = await storage.getAll<TimelineAction>(STORAGE_KEYS.ACTIONS);
      setActions(actionsData);
    } catch (err) {
      setError(err as StorageError);
      // Still set empty array on error
      setActions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD operations
  const createAction = useCallback(async (
    actionData: CreateInput<TimelineAction>
  ): Promise<TimelineAction> => {
    try {
      // Auto-assign sort order if not provided
      if (actionData.sortOrder === undefined) {
        const visitActions = await getActionsByVisit(actionData.visitId);
        const maxSortOrder = Math.max(...visitActions.map(a => a.sortOrder || 0), 0);
        actionData.sortOrder = maxSortOrder + 1;
      }

      const newAction = await storage.create<TimelineAction>(STORAGE_KEYS.ACTIONS, actionData);
      
      // Update visit's cached action count
      const visit = await storage.get<Visit>(STORAGE_KEYS.VISITS, actionData.visitId);
      if (visit) {
        await storage.update<Visit>(STORAGE_KEYS.VISITS, visit.id, {
          actionCount: (visit.actionCount || 0) + 1,
          totalPhotoCount: (visit.totalPhotoCount || 0) + (actionData.photos?.length || 0),
        });
      }

      await loadData();
      return newAction;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const updateAction = useCallback(async (
    id: string,
    updates: UpdateInput<TimelineAction>
  ): Promise<TimelineAction | null> => {
    try {
      const currentAction = await storage.get<TimelineAction>(STORAGE_KEYS.ACTIONS, id);
      if (!currentAction) return null;

      const updatedAction = await storage.update<TimelineAction>(STORAGE_KEYS.ACTIONS, id, updates);
      
      // Update visit's cached photo count if photos changed
      if (updates.photos !== undefined && currentAction.photos.length !== updates.photos.length) {
        const visit = await storage.get<Visit>(STORAGE_KEYS.VISITS, currentAction.visitId);
        if (visit) {
          const photoDiff = updates.photos.length - currentAction.photos.length;
          await storage.update<Visit>(STORAGE_KEYS.VISITS, visit.id, {
            totalPhotoCount: (visit.totalPhotoCount || 0) + photoDiff,
          });
        }
      }

      await loadData();
      return updatedAction;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const deleteAction = useCallback(async (id: string): Promise<boolean> => {
    try {
      const action = await storage.get<TimelineAction>(STORAGE_KEYS.ACTIONS, id);
      if (!action) return false;

      const result = await storage.delete<TimelineAction>(STORAGE_KEYS.ACTIONS, id);
      
      if (result) {
        // Update visit's cached counts
        const visit = await storage.get<Visit>(STORAGE_KEYS.VISITS, action.visitId);
        if (visit) {
          await storage.update<Visit>(STORAGE_KEYS.VISITS, visit.id, {
            actionCount: Math.max((visit.actionCount || 0) - 1, 0),
            totalPhotoCount: Math.max((visit.totalPhotoCount || 0) - action.photos.length, 0),
          });
        }
      }

      await loadData();
      return result;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const deleteAllActions = useCallback(async (): Promise<boolean> => {
    try {
      // Clear all actions
      await storage.clear(STORAGE_KEYS.ACTIONS);
      
      // Reset action counts in all visits
      const allVisits = await storage.getAll<Visit>(STORAGE_KEYS.VISITS);
      if (allVisits.length > 0) {
        const updates = allVisits.map(visit => ({
          id: visit.id,
          data: { 
            actionCount: 0,
            totalPhotoCount: 0
          }
        }));
        await storage.updateMany<Visit>(STORAGE_KEYS.VISITS, updates);
      }
      
      await loadData();
      return true;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getAction = useCallback(async (id: string): Promise<TimelineAction | null> => {
    try {
      return await storage.get<TimelineAction>(STORAGE_KEYS.ACTIONS, id);
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  // Batch operations
  const createMultipleActions = useCallback(async (
    actionsData: CreateInput<TimelineAction>[]
  ): Promise<TimelineAction[]> => {
    try {
      // Group by visit to assign sort orders
      const actionsByVisit = actionsData.reduce((acc, action) => {
        if (!acc[action.visitId]) acc[action.visitId] = [];
        acc[action.visitId].push(action);
        return acc;
      }, {} as Record<string, CreateInput<TimelineAction>[]>);

      // Assign sort orders for each visit
      for (const visitId in actionsByVisit) {
        const visitActions = await getActionsByVisit(visitId);
        let maxSortOrder = Math.max(...visitActions.map(a => a.sortOrder || 0), 0);
        
        actionsByVisit[visitId].forEach(action => {
          if (action.sortOrder === undefined) {
            action.sortOrder = ++maxSortOrder;
          }
        });
      }

      const newActions = await storage.createMany<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        actionsData
      );

      // Update visit cached counts
      const visitUpdates = Object.entries(actionsByVisit).map(([visitId, visitActions]) => ({
        id: visitId,
        data: {
          actionCount: actions.filter(a => a.visitId === visitId).length + visitActions.length,
          totalPhotoCount: actions.filter(a => a.visitId === visitId).reduce((sum, a) => sum + a.photos.length, 0) +
                          visitActions.reduce((sum, a) => sum + (a.photos?.length || 0), 0),
        },
      }));

      if (visitUpdates.length > 0) {
        await storage.updateMany<Visit>(STORAGE_KEYS.VISITS, visitUpdates);
      }

      await loadData();
      return newActions;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [actions]);

  const updateMultipleActions = useCallback(async (
    updates: Array<{ id: string; data: UpdateInput<TimelineAction> }>
  ): Promise<TimelineAction[]> => {
    try {
      const updatedActions = await storage.updateMany<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        updates
      );
      await loadData();
      return updatedActions;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const deleteMultipleActions = useCallback(async (ids: string[]): Promise<number> => {
    try {
      // Get actions to update visit counts
      const actionsToDelete = await Promise.all(
        ids.map(id => storage.get<TimelineAction>(STORAGE_KEYS.ACTIONS, id))
      );
      const validActions = actionsToDelete.filter(Boolean) as TimelineAction[];

      const deletedCount = await storage.deleteMany<TimelineAction>(STORAGE_KEYS.ACTIONS, ids);

      // Update visit cached counts
      const visitCounts = validActions.reduce((acc, action) => {
        if (!acc[action.visitId]) {
          acc[action.visitId] = { actionCount: 0, photoCount: 0 };
        }
        acc[action.visitId].actionCount++;
        acc[action.visitId].photoCount += action.photos.length;
        return acc;
      }, {} as Record<string, { actionCount: number; photoCount: number }>);

      const visitUpdates = await Promise.all(
        Object.entries(visitCounts).map(async ([visitId, counts]) => {
          const visit = await storage.get<Visit>(STORAGE_KEYS.VISITS, visitId);
          if (visit) {
            return {
              id: visitId,
              data: {
                actionCount: Math.max((visit.actionCount || 0) - counts.actionCount, 0),
                totalPhotoCount: Math.max((visit.totalPhotoCount || 0) - counts.photoCount, 0),
              },
            };
          }
          return null;
        })
      ).then(results => results.filter(Boolean) as Array<{ id: string; data: Partial<Visit> }>);

      if (visitUpdates.length > 0) {
        await storage.updateMany<Visit>(STORAGE_KEYS.VISITS, visitUpdates);
      }

      await loadData();
      return deletedCount;
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  // Query operations
  const getActionsByVisit = useCallback(async (visitId: string): Promise<TimelineAction[]> => {
    try {
      const visitActions = await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => action.visitId === visitId
      );
      return sortActions(visitActions, { field: 'time', direction: 'ASC' });
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getActionsByCategory = useCallback(async (
    category: ActionCategory
  ): Promise<TimelineAction[]> => {
    try {
      return await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => action.category === category
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getActionsByArea = useCallback(async (area: ParkArea): Promise<TimelineAction[]> => {
    try {
      return await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => action.area === area
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getActionsByDateRange = useCallback(async (
    dateRange: DateRange
  ): Promise<TimelineAction[]> => {
    try {
      // First get visits in date range (using JST)
      const visits = await storage.find<Visit>(
        STORAGE_KEYS.VISITS,
        visit => {
          const jstOffset = 9 * 60; // JST is UTC+9
          const visitDate = new Date(visit.date);
          const visitDateJST = new Date(visitDate.getTime() + (jstOffset * 60 * 1000));
          const startDateJST = new Date(dateRange.startDate.getTime() + (jstOffset * 60 * 1000));
          const endDateJST = new Date(dateRange.endDate.getTime() + (jstOffset * 60 * 1000));
          
          return visitDateJST >= startDateJST && visitDateJST <= endDateJST;
        }
      );
      const visitIds = visits.map(v => v.id);

      // Then get actions for those visits
      return await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => visitIds.includes(action.visitId)
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  const getFilteredActions = useCallback(async (
    filter: ActionFilter
  ): Promise<TimelineAction[]> => {
    try {
      return await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => {
          if (filter.visitId && action.visitId !== filter.visitId) return false;
          if (filter.category && action.category !== filter.category) return false;
          if (filter.area && action.area !== filter.area) return false;
          if (filter.locationName && 
              !action.locationName.toLowerCase().includes(filter.locationName.toLowerCase())) {
            return false;
          }
          
          if (filter.dateRange) {
            // Need to check visit date
            return true; // Will be filtered in post-processing
          }
          
          return true;
        }
      );
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  // Sorting
  const sortActions = useCallback((
    actionsToSort: TimelineAction[],
    sortBy: SortOptions<TimelineAction>
  ): TimelineAction[] => {
    return [...actionsToSort].sort((a, b) => {
      const aValue = a[sortBy.field];
      const bValue = b[sortBy.field];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortBy.direction === 'ASC' ? comparison : -comparison;
    });
  }, []);

  const reorderActions = useCallback(async (
    visitId: string,
    actionIds: string[]
  ): Promise<void> => {
    try {
      const updates = actionIds.map((id, index) => ({
        id,
        data: { sortOrder: index },
      }));

      await storage.updateMany<TimelineAction>(STORAGE_KEYS.ACTIONS, updates);
      await loadData();
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, []);

  // Photo operations
  const addPhotosToAction = useCallback(async (
    actionId: string,
    photos: Photo[]
  ): Promise<TimelineAction | null> => {
    try {
      const action = await storage.get<TimelineAction>(STORAGE_KEYS.ACTIONS, actionId);
      if (!action) return null;

      const updatedPhotos = [...action.photos, ...photos];
      return await updateAction(actionId, { photos: updatedPhotos });
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [updateAction]);

  const removePhotoFromAction = useCallback(async (
    actionId: string,
    photoId: string
  ): Promise<TimelineAction | null> => {
    try {
      const action = await storage.get<TimelineAction>(STORAGE_KEYS.ACTIONS, actionId);
      if (!action) return null;

      const updatedPhotos = action.photos.filter(photo => photo.id !== photoId);
      return await updateAction(actionId, { photos: updatedPhotos });
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [updateAction]);

  // Statistics
  const getActionStatistics = useCallback(async (
    filter?: ActionFilter
  ): Promise<ActionStats> => {
    try {
      let filteredActions = filter
        ? await getFilteredActions(filter)
        : await storage.getAll<TimelineAction>(STORAGE_KEYS.ACTIONS);

      // Apply date range filter if needed (using JST)
      if (filter?.dateRange) {
        const visits = await storage.find<Visit>(
          STORAGE_KEYS.VISITS,
          visit => {
            const jstOffset = 9 * 60; // JST is UTC+9
            const visitDate = new Date(visit.date);
            const visitDateJST = new Date(visitDate.getTime() + (jstOffset * 60 * 1000));
            const startDateJST = new Date(filter.dateRange!.startDate.getTime() + (jstOffset * 60 * 1000));
            const endDateJST = new Date(filter.dateRange!.endDate.getTime() + (jstOffset * 60 * 1000));
            
            return visitDateJST >= startDateJST && visitDateJST <= endDateJST;
          }
        );
        const visitIds = new Set(visits.map(v => v.id));
        filteredActions = filteredActions.filter(action => visitIds.has(action.visitId));
      }

      // Exclude custom actions from analytics calculations
      filteredActions = filteredActions.filter(action => action.category !== ActionCategory.CUSTOM);

      // Calculate actions by category
      const actionsByCategory = filteredActions.reduce((acc, action) => {
        acc[action.category] = (acc[action.category] || 0) + 1;
        return acc;
      }, {} as Record<ActionCategory, number>);

      // Calculate top attractions
      const attractionCounts = new Map<string, { count: number; totalWaitTime: number }>();
      filteredActions
        .filter(action => action.category === ActionCategory.ATTRACTION)
        .forEach(action => {
          const current = attractionCounts.get(action.locationName) || { count: 0, totalWaitTime: 0 };
          attractionCounts.set(action.locationName, {
            count: current.count + 1,
            totalWaitTime: current.totalWaitTime + (action.waitTime || 0),
          });
        });

      const topAttractions = Array.from(attractionCounts.entries())
        .map(([locationName, stats]) => ({
          locationName,
          count: stats.count,
          averageWaitTime: stats.count > 0 && stats.totalWaitTime > 0 
            ? Math.round(stats.totalWaitTime / stats.count) 
            : undefined,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate top restaurants
      const restaurantCounts = new Map<string, number>();
      filteredActions
        .filter(action => action.category === ActionCategory.RESTAURANT)
        .forEach(action => {
          restaurantCounts.set(
            action.locationName,
            (restaurantCounts.get(action.locationName) || 0) + 1
          );
        });

      const topRestaurants = Array.from(restaurantCounts.entries())
        .map(([locationName, count]) => ({ locationName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate area distribution
      const areaStats = new Map<ParkArea, { visitCount: number; timeSpent: number }>();
      filteredActions.forEach(action => {
        const current = areaStats.get(action.area) || { visitCount: 0, timeSpent: 0 };
        areaStats.set(action.area, {
          visitCount: current.visitCount + 1,
          timeSpent: current.timeSpent + (action.duration || 0),
        });
      });

      const areaDistribution = Array.from(areaStats.entries())
        .map(([area, stats]) => ({
          area,
          visitCount: stats.visitCount,
          timeSpent: stats.timeSpent,
        }))
        .sort((a, b) => b.visitCount - a.visitCount);

      // Calculate photo count
      const photoCount = filteredActions.reduce((sum, action) => sum + action.photos.length, 0);

      // Calculate average actions per visit with safety check
      const uniqueVisitIds = new Set(filteredActions.map(a => a.visitId));
      const averageActionsPerVisit = uniqueVisitIds.size > 0
        ? filteredActions.length / uniqueVisitIds.size
        : 0;

      return {
        totalActions: filteredActions.length,
        actionsByCategory,
        topAttractions,
        topRestaurants,
        areaDistribution,
        averageActionsPerVisit,
        photoCount,
      };
    } catch (err) {
      setError(err as StorageError);
      throw err;
    }
  }, [getFilteredActions]);

  const getLocationVisitCount = useCallback(async (locationName: string): Promise<number> => {
    try {
      const matchingActions = await storage.find<TimelineAction>(
        STORAGE_KEYS.ACTIONS,
        action => action.locationName.toLowerCase() === locationName.toLowerCase()
      );
      return matchingActions.length;
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
    actions,
    isLoading,
    error,

    // CRUD operations
    createAction,
    updateAction,
    deleteAction,
    deleteAllActions,
    getAction,

    // Batch operations
    createMultipleActions,
    updateMultipleActions,
    deleteMultipleActions,

    // Query operations
    getActionsByVisit,
    getActionsByCategory,
    getActionsByArea,
    getActionsByDateRange,
    getFilteredActions,

    // Sorting and ordering
    sortActions,
    reorderActions,

    // Photo operations
    addPhotosToAction,
    removePhotoFromAction,

    // Statistics
    getActionStatistics,
    getLocationVisitCount,

    // Utility
    refreshData,
  };
}