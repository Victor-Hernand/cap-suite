const LOOM_HOSTS = ['loom.com', 'www.loom.com'];

// El id de un video de Loom son 32 caracteres hex; el enlace de compartir puede
// anteponerle el título del video ("Manual-del-admin-<id>").
const LOOM_VIDEO_PATH = /^\/(?:share|embed)\/(?:[\w-]*-)?([0-9a-f]{32})\/?$/i;

/** Devuelve la URL para embeber un enlace de Loom (share o embed), o null si no es un video de Loom. */
export function loomEmbedUrl(link: string | null): string | null {
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !LOOM_HOSTS.includes(url.hostname)) return null;
  const match = LOOM_VIDEO_PATH.exec(url.pathname);
  return match ? `https://www.loom.com/embed/${match[1].toLowerCase()}` : null;
}
