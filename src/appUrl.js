export const buildAppUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window === 'undefined') {
    return normalizedPath;
  }
  const origin = window.location.origin;
  const basePath = import.meta.env.BASE_URL || '/';
  const isGitHubPagesStyle = import.meta.env.PROD && basePath !== '/';
  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  return isGitHubPagesStyle
    ? `${origin}${cleanBase}#${normalizedPath}`
    : `${origin}${normalizedPath}`;
};
