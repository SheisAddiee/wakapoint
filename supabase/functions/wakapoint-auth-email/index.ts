import { createAuthEmailHandler } from './core.ts';

Deno.serve(createAuthEmailHandler({ env: name => Deno.env.get(name), fetch: globalThis.fetch.bind(globalThis) }));
