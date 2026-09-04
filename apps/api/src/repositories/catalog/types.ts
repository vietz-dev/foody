import type { Effect } from 'effect';
import type { CatalogRepositoryError } from './errors.js';

export type ConfirmCatalogEntryRequest = {
  name?: string;
  isStaple?: boolean;
};

export type CatalogOverview = {
  defaultServingRecipes: unknown[];
  pendingCount: number;
};

export type CatalogBackfillResult = {
  linkedCount: number;
  pendingCount: number;
};

export type ICatalogRepository = {
  list: (householdId: string) => Effect.Effect<unknown, CatalogRepositoryError>;
  overview: (householdId: string) => Effect.Effect<CatalogOverview, CatalogRepositoryError>;
  confirm: (
    householdId: string,
    id: string,
    data: ConfirmCatalogEntryRequest
  ) => Effect.Effect<void, CatalogRepositoryError>;
  merge: (
    householdId: string,
    sourceId: string,
    targetId: string
  ) => Effect.Effect<void, CatalogRepositoryError>;
  backfill: (householdId: string) => Effect.Effect<CatalogBackfillResult, CatalogRepositoryError>;
};

export const catalogEntrySelect = {
  id: true,
  name: true,
  isStaple: true,
  aliases: true,
  status: true
} as const;
