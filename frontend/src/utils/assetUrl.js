export function toPublicAssetUrl(path) {
  if (!path || typeof path !== 'string') {
    return '';
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `/uploads/${normalized}`;
}
