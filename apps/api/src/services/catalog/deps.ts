import { Layer } from 'effect';
import type { CatalogRepository } from '../../repositories/catalog/repository.js';
import { CatalogService, CatalogServiceLive } from './service.js';

export const makeCatalogServiceDeps = (
  catalogRepository: Layer.Layer<CatalogRepository>
): Layer.Layer<CatalogService> => CatalogServiceLive.pipe(Layer.provide(catalogRepository));
