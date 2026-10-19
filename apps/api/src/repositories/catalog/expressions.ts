import type { PrismaClient } from '../../generated/prisma/client.js';

type ExpressionClient = Pick<PrismaClient, 'ingredientExpression'>;

export const ensureIngredientExpression = (
  db: ExpressionClient,
  ingredientId: string,
  name: string
) =>
  db.ingredientExpression.upsert({
    where: { ingredientId_name: { ingredientId, name } },
    create: { ingredientId, name },
    update: {}
  });
