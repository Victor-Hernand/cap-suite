import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';
import { readEnv } from './lib/env';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isProtectedAction = pathname.startsWith('/_actions/') && !pathname.includes('auth.login');
  if (!isAdminPage && !isProtectedAction) return next();

  const secret = readEnv('SESSION_SECRET');
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (secret && verifySessionToken(token, secret)) return next();

  if (isProtectedAction) return new Response('No autorizado', { status: 401 });
  return context.redirect('/admin/login');
});
