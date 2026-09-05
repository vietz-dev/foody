import { Layer } from 'effect';
import type { PrismaService } from '../../infrastructure/prisma.js';
import { PicnicRepository, PicnicRepositoryLive } from './repository.js';

export const makePicnicRepositoryDeps = (
  prismaService: Layer.Layer<PrismaService>
): Layer.Layer<PicnicRepository> => PicnicRepositoryLive.pipe(Layer.provide(prismaService));
