import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';
import { readEnv } from './lib/env';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isProtectedAction = pathname.startsWith('/_actions/') && pathname !== '/_actions/auth.login';

  // Astro también ejecuta actions vía form-fallback: un POST a CUALQUIER
  // página con ?_action=<nombre> y content-type de formulario corre la
  // action tras este middleware. Sin esto, una ruta pública (p. ej. /apps)
  // permitía mutaciones sin sesión con solo agregar ese query param.
  const formAction = context.url.searchParams.get('_action');
  const isFormAction =
    context.request.method === 'POST' && !!formAction && formAction !== 'auth.login';

  if (!isAdminPage && !isProtectedAction && !isFormAction) return next();

  const secret = readEnv('SESSION_SECRET');
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (secret && verifySessionToken(token, secret)) return next();

  if (isProtectedAction) return new Response('No autorizado', { status: 401 });
  return context.redirect('/admin/login');
});
