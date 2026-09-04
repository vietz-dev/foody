import { Layer } from 'effect';
import type { PrismaService } from '../../infrastructure/prisma.js';
import { ShoppingListRepository, ShoppingListRepositoryLive } from './repository.js';

export const makeShoppingListRepositoryDeps = (
  prismaService: Layer.Layer<PrismaService>
): Layer.Layer<ShoppingListRepository> =>
  ShoppingListRepositoryLive.pipe(Layer.provide(prismaService));
