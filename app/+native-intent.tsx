type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

const APP_SCHEME_PREFIX = /^janani:\/\//i;

function normalizeNativePath(path: string) {
  const trimmed = path.trim();

  if (!trimmed || /^janani:\/\/?$/i.test(trimmed) || /^janani:\/\/\/$/i.test(trimmed)) {
    return '/';
  }

  if (APP_SCHEME_PREFIX.test(trimmed)) {
    const withoutScheme = trimmed.replace(APP_SCHEME_PREFIX, '');
    const normalized = withoutScheme.replace(/^\/+/, '');
    if (!normalized) return '/';
    return `/${normalized}`;
  }

  return trimmed;
}

export function redirectSystemPath({ path }: RedirectSystemPathOptions) {
  try {
    return normalizeNativePath(path);
  } catch {
    return '/';
  }
}
