import Elysia from 'elysia';

export const health = new Elysia({ name: 'HealthRoute', prefix: '/health' })
  .get('/', () => 'ok', {
    detail: {
      tags: ['Health'],
    },
  })
  .head('/', () => 'ok', {
    detail: {
      tags: ['Health'],
    },
  });
