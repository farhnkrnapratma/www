import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname.toLowerCase().replace(/\/$/, '');

  if (['/blogs', '/projects', '/contacts', '/cv', '/funding', '/home'].includes(pathname)) {
    const section = pathname.replace('/', '');
    throw redirect(307, `/#${section}`);
  }

  if (pathname === '/blog') {
    throw redirect(307, '/#blogs');
  }

  return resolve(event);
};
