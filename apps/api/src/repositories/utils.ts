export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const normalizeIngredientName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');
