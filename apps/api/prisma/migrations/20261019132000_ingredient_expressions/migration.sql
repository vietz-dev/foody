CREATE TABLE "ingredient_expressions" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_expressions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "recipe_ingredients" ADD COLUMN "expressionId" TEXT;

CREATE UNIQUE INDEX "ingredient_expressions_ingredientId_name_key"
    ON "ingredient_expressions"("ingredientId", "name");
CREATE INDEX "ingredient_expressions_ingredientId_idx"
    ON "ingredient_expressions"("ingredientId");
CREATE INDEX "recipe_ingredients_expressionId_idx"
    ON "recipe_ingredients"("expressionId");

ALTER TABLE "ingredient_expressions" ADD CONSTRAINT "ingredient_expressions_ingredientId_fkey"
    FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_expressionId_fkey"
    FOREIGN KEY ("expressionId") REFERENCES "ingredient_expressions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve every surviving catalog name and alias as a removable group member.
INSERT INTO "ingredient_expressions" ("id", "ingredientId", "name")
SELECT 'expr_' || md5(i."id" || ':' || btrim(names."name")), i."id", btrim(names."name")
FROM "ingredients" AS i
CROSS JOIN LATERAL unnest(array_prepend(i."name", i."aliases")) AS names("name")
WHERE btrim(names."name") <> ''
ON CONFLICT ("ingredientId", "name") DO NOTHING;

-- A merged source row no longer exists, but recipe text still retains its wording.
INSERT INTO "ingredient_expressions" ("id", "ingredientId", "name")
SELECT 'expr_' || md5(r."ingredientId" || ':' || btrim(r."name")),
       r."ingredientId", btrim(r."name")
FROM "recipe_ingredients" AS r
WHERE r."ingredientId" IS NOT NULL AND btrim(r."name") <> ''
ON CONFLICT ("ingredientId", "name") DO NOTHING;

UPDATE "recipe_ingredients" AS r
SET "expressionId" = e."id"
FROM "ingredient_expressions" AS e
WHERE r."ingredientId" = e."ingredientId" AND btrim(r."name") = e."name";

-- Keep recovered recipe wording discoverable when new recipes are imported.
UPDATE "ingredients" AS i
SET "aliases" = COALESCE(
    (
        SELECT array_agg(DISTINCT e."name" ORDER BY e."name")
        FROM "ingredient_expressions" AS e
        WHERE e."ingredientId" = i."id"
          AND lower(btrim(e."name")) <> lower(btrim(i."name"))
    ),
    ARRAY[]::TEXT[]
);
