import { Context, Effect, Layer } from 'effect';
import { decrypt, encrypt } from '../../infrastructure/crypto.js';
import { PrismaService } from '../../infrastructure/prisma.js';
import { getErrorMessage } from '../utils.js';
import { PicnicRepositoryError } from './errors.js';
import type { IPicnicRepository } from './types.js';

export class PicnicRepository extends Context.Tag('PicnicRepository')<
  PicnicRepository,
  IPicnicRepository
>() {}

export const PicnicRepositoryLive = Layer.effect(
  PicnicRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const run = <A>(fn: () => Promise<A>) =>
      Effect.tryPromise({
        try: fn,
        catch: (error) =>
          new PicnicRepositoryError({ message: getErrorMessage(error), cause: error })
      });

    const repository: IPicnicRepository = {
      getAccount: (userId) =>
        run(async () => {
          const row = await db.picnicAccount.findUnique({ where: { userId } });
          return row ? { ...row, authKey: decrypt(row.authKey) } : null;
        }),
      saveAccount: ({ userId, ...account }) =>
        run(async () => {
          const data = { ...account, authKey: encrypt(account.authKey) };
          await db.picnicAccount.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data
          });
        }),
      deleteAccount: (userId) =>
        run(async () => {
          await db.picnicAccount.deleteMany({ where: { userId } });
        }),
      mapIngredient: (householdId, ingredientId, product) =>
        run(async () => {
          await db.ingredient.updateMany({
            where: { id: ingredientId, householdId },
            data: {
              picnicProductId: product?.id ?? null,
              picnicProductName: product?.name ?? null,
              picnicUnitQuantity: product?.unitQuantity ?? null
            }
          });
        })
    };
    return PicnicRepository.of(repository);
  })
);
