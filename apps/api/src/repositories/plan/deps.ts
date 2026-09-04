import { Layer } from 'effect';
import type { PrismaService } from '../../infrastructure/prisma.js';
import { PlanRepository, PlanRepositoryLive } from './repository.js';

export const makePlanRepositoryDeps = (
  prismaService: Layer.Layer<PrismaService>
): Layer.Layer<PlanRepository> => PlanRepositoryLive.pipe(Layer.provide(prismaService));
