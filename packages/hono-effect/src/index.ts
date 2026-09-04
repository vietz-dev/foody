import { Effect, ManagedRuntime } from 'effect';
import type { Context, Layer } from 'effect';

export type RunOptions = {
  readonly signal?: AbortSignal;
};

export type HonoEffectRuntime<R> = {
  run: <A, E>(program: Effect.Effect<A, E, R>, options?: RunOptions) => Promise<A>;
  runService: <Identifier extends R, Service, A, E, Requirements extends R = never>(
    tag: Context.Tag<Identifier, Service>,
    call: (service: Service) => Effect.Effect<A, E, Requirements>,
    options?: RunOptions
  ) => Promise<A>;
  dispose: () => Promise<void>;
};

/**
 * Owns a managed Effect runtime at the HTTP boundary and exposes Promise-based
 * operations suitable for Hono and oRPC handlers.
 */
export const createHonoEffectRuntime = <R, LayerError>(
  layer: Layer.Layer<R, LayerError, never>
): HonoEffectRuntime<R> => {
  const runtime = ManagedRuntime.make(layer);
  const run: HonoEffectRuntime<R>['run'] = (program, options) =>
    runtime.runPromise(program, options);
  const runService = <Identifier extends R, Service, A, E, Requirements extends R = never>(
    tag: Context.Tag<Identifier, Service>,
    call: (service: Service) => Effect.Effect<A, E, Requirements>,
    options?: RunOptions
  ): Promise<A> => {
    const program = Effect.flatMap(tag, call);
    return runtime.runPromise(program as Effect.Effect<A, E, R>, options);
  };

  return {
    run,
    runService,
    dispose: () => runtime.dispose()
  };
};
