import { createGateway } from './core.ts';

Deno.serve(createGateway({ env: name => Deno.env.get(name), fetch: globalThis.fetch.bind(globalThis) }));
