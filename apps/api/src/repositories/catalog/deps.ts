import { Layer } from 'effect';
import type { PrismaService } from '../../infrastructure/prisma.js';
import { CatalogRepository, CatalogRepositoryLive } from './repository.js';

export const makeCatalogRepositoryDeps = (
  prismaService: Layer.Layer<PrismaService>
): Layer.Layer<CatalogRepository> => CatalogRepositoryLive.pipe(Layer.provide(prismaService));
