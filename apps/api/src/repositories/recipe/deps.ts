import { Layer } from 'effect';
import type { PrismaService } from '../../infrastructure/prisma.js';
import { RecipeRepository, RecipeRepositoryLive } from './repository.js';

export const makeRecipeRepositoryDeps = (
  prismaService: Layer.Layer<PrismaService>
): Layer.Layer<RecipeRepository> => RecipeRepositoryLive.pipe(Layer.provide(prismaService));
