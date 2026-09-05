/**
 * Default context: the tenant record every user is attached to on first
 * sign-in (household, team, workspace, ...). Declare which user column holds
 * its id and how to create one; the auth stack fills the column on sign-up and
 * resolves it from sessions via `resolveContext`.
 *
 * ```ts
 * const teamContext = defineContext({
 *   field: 'teamId',
 *   create: async (user) => (await prisma.team.create({ data: { name: `${user.name}'s team` } })).id
 * });
 * ```
 * The column (`teamId`) must exist on the user model in your Prisma schema.
 */
export type DefaultContext<Field extends string = string> = {
  field: Field;
  create: (user: { name: string; email: string }) => Promise<string>;
};

export const defineContext = <const Field extends string>(context: DefaultContext<Field>) =>
  context;
