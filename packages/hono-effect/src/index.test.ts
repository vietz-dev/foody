import { Context, Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';
import { createHonoEffectRuntime } from './index.js';

class GreetingService extends Context.Tag('GreetingService')<
  GreetingService,
  { greet: (name: string) => Effect.Effect<string> }
>() {}

describe('createHonoEffectRuntime', () => {
  it('runs effects through the managed runtime', async () => {
    const runtime = createHonoEffectRuntime(Layer.empty);

    const result = await runtime.run(Effect.succeed('ready'));

    expect(result).toBe('ready');
    await runtime.dispose();
  });

  it('rejects the handler promise when an effect fails', async () => {
    const runtime = createHonoEffectRuntime(Layer.empty);

    const result = runtime.run(Effect.fail(new Error('request failed')));

    await expect(result).rejects.toThrow('request failed');
    await runtime.dispose();
  });

  it('resolves and invokes an Effect service', async () => {
    const runtime = createHonoEffectRuntime(
      Layer.succeed(
        GreetingService,
        GreetingService.of({ greet: (name) => Effect.succeed(`Hello, ${name}!`) })
      )
    );

    const result = await runtime.runService(GreetingService, (service) => service.greet('Ada'));

    expect(result).toBe('Hello, Ada!');
    await runtime.dispose();
  });

  it('releases scoped resources when disposed', async () => {
    let released = false;
    const layer = Layer.scoped(
      GreetingService,
      Effect.acquireRelease(
        Effect.succeed(GreetingService.of({ greet: () => Effect.succeed('ready') })),
        () => Effect.sync(() => void (released = true))
      )
    );
    const runtime = createHonoEffectRuntime(layer);
    await runtime.runService(GreetingService, (service) => service.greet('Ada'));

    await runtime.dispose();

    expect(released).toBe(true);
  });
});
