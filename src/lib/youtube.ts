const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const PATH_PREFIXES = ['shorts', 'embed', 'live', 'v'];

export function isVideoId(s: string): boolean {
  return ID_RE.test(s);
}

/** Extracts the 11-char video id from a YouTube link or a bare id. Returns null for anything else. */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (isVideoId(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let candidate: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    candidate = parts[0] ?? null;
  } else if (HOSTS.has(host)) {
    if (parts[0] === 'watch') candidate = url.searchParams.get('v');
    else if (PATH_PREFIXES.includes(parts[0])) candidate = parts[1] ?? null;
  }

  return candidate && isVideoId(candidate) ? candidate : null;
}

export function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
