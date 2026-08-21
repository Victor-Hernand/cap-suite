import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { constantTimeEquals, createSessionToken, SESSION_COOKIE, SESSION_DURATION_MS } from '../lib/session';
import { readEnv } from '../lib/env';

const delay = (ms: number) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

export const server = {
  auth: {
    login: defineAction({
      accept: 'form',
      input: z.object({ password: z.string().min(1, 'Escribe la contraseña') }),
      handler: async ({ password }, context) => {
        const adminPassword = readEnv('ADMIN_PASSWORD');
        const secret = readEnv('SESSION_SECRET');
        if (!adminPassword || !secret) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Faltan ADMIN_PASSWORD o SESSION_SECRET en el servidor.',
          });
        }
        if (!constantTimeEquals(password, adminPassword)) {
          await delay(500);
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Contraseña incorrecta.' });
        }
        context.cookies.set(SESSION_COOKIE, createSessionToken(secret), {
          httpOnly: true,
          sameSite: 'lax',
          secure: import.meta.env.PROD,
          path: '/',
          maxAge: SESSION_DURATION_MS / 1000,
        });
        return { ok: true };
      },
    }),
  },
};
