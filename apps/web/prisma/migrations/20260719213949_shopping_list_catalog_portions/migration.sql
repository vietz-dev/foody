-- CreateEnum
CREATE TYPE "IngredientStatus" AS ENUM ('pending', 'confirmed');

-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN     "ingredientId" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "declaredServings" INTEGER;

-- AlterTable
ALTER TABLE "weekly_plan_items" ADD COLUMN     "portions" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IngredientStatus" NOT NULL DEFAULT 'pending',
    "isStaple" BOOLEAN NOT NULL DEFAULT false,
    "aliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredients_householdId_idx" ON "ingredients"("householdId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredientId_idx" ON "recipe_ingredients"("ingredientId");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data backfill: existing recipes get a default declared serving count
UPDATE "recipes" SET "declaredServings" = 2 WHERE "declaredServings" IS NULL;
