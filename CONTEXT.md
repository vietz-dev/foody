# Foody Domain Language

## Household

The isolation boundary for recipes, planning, catalog entries, and shopping
lists. Every API operation receives the household from authenticated context;
clients cannot choose it.

## Recipe

A household-owned dish definition with ingredients and preparation steps.
Ingredient quantities are persisted per one portion; `declaredServings` keeps
the original recipe serving count.

## Weekly plan

The household's selected recipes for the current planning period. A plan item
stores selection state and the number of portions to prepare.

## Ingredient catalog

The household-wide canonical vocabulary for ingredients. New names are
`pending` until reviewed; confirmed entries may be marked as `isStaple` and
can absorb aliases through merging.

## Shopping list

A derived view of selected weekly-plan recipes. It groups mapped ingredients
by catalog identity and separates them into shopping, staple, and unmapped
sections.

## Picnic account

A per-user link to the Picnic online supermarket. Foody stores only the
encrypted Picnic session token (never the password); ordering and payment stay
in the Picnic app. Connecting may require a one-time SMS code.

## Picnic mapping

The household-wide answer to "which Picnic product is this ingredient". It lives
on the catalog entry (`picnicProductId`, name, pack size). The shopping list
turns the aggregated quantity into a suggested pack count; pushing to the cart
only tops up what is not already in it.
