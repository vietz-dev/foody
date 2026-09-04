import { Context, Effect, Layer } from 'effect';
import { CatalogRepository } from '../../repositories/catalog/repository.js';
import type { ConfirmCatalogEntryRequest } from '../../repositories/catalog/types.js';
import { CatalogServiceError } from './errors.js';
import { mapCatalogServiceError } from './internal.js';

export type ICatalogService = {
  list: (householdId: string) => Effect.Effect<any, CatalogServiceError>;
  overview: (householdId: string) => Effect.Effect<any, CatalogServiceError>;
  confirm: (
    householdId: string,
    id: string,
    data: ConfirmCatalogEntryRequest
  ) => Effect.Effect<{ success: true }, CatalogServiceError>;
  merge: (
    householdId: string,
    sourceId: string,
    targetId: string
  ) => Effect.Effect<{ success: true }, CatalogServiceError>;
  backfill: (
    householdId: string
  ) => Effect.Effect<
    { success: true; linkedCount: number; pendingCount: number },
    CatalogServiceError
  >;
};

export class CatalogService extends Context.Tag('CatalogService')<
  CatalogService,
  ICatalogService
>() {}

export const CatalogServiceLive = Layer.effect(
  CatalogService,
  Effect.gen(function* () {
    const repository = yield* CatalogRepository;
    const service: ICatalogService = {
      list: (householdId) =>
        repository.list(householdId).pipe(Effect.mapError(mapCatalogServiceError)),
      overview: (householdId) =>
        repository.overview(householdId).pipe(Effect.mapError(mapCatalogServiceError)),
      confirm: (householdId, id, data) =>
        repository
          .confirm(householdId, id, data)
          .pipe(Effect.as({ success: true as const }), Effect.mapError(mapCatalogServiceError)),
      merge: (householdId, sourceId, targetId) =>
        repository
          .merge(householdId, sourceId, targetId)
          .pipe(Effect.as({ success: true as const }), Effect.mapError(mapCatalogServiceError)),
      backfill: (householdId) =>
        repository.backfill(householdId).pipe(
          Effect.map((result) => ({ success: true as const, ...result })),
          Effect.mapError(mapCatalogServiceError)
        )
    };

    return CatalogService.of(service);
  })
);
