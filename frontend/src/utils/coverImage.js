const DEFAULT_VARIANTS = {
  card: '',
  list: '',
  background: '',
};

function normalizeVariantPath(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parseStructuredCover(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { ...DEFAULT_VARIANTS };
  }

  const source = parsed.variants && typeof parsed.variants === 'object' ? parsed.variants : parsed;
  const fallback = normalizeVariantPath(source.url || parsed.url || '');

  return {
    card: normalizeVariantPath(source.card) || fallback,
    list: normalizeVariantPath(source.list) || normalizeVariantPath(source.card) || fallback,
    background:
      normalizeVariantPath(source.background) ||
      normalizeVariantPath(source.list) ||
      normalizeVariantPath(source.card) ||
      fallback,
  };
}

export function parseCoverImage(value) {
  if (!value || typeof value !== 'string') {
    return { ...DEFAULT_VARIANTS };
  }

  const trimmed = normalizeVariantPath(value);
  if (!trimmed) {
    return { ...DEFAULT_VARIANTS };
  }

  // Handle values accidentally serialized twice: "{...}"
  if (
    (trimmed.startsWith('"{') && trimmed.endsWith('}"')) ||
    (trimmed.startsWith("'{") && trimmed.endsWith("}'"))
  ) {
    return parseCoverImage(trimmed.slice(1, -1));
  }

  if (!trimmed.startsWith('{')) {
    return {
      card: trimmed,
      list: trimmed,
      background: trimmed,
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') {
      return parseCoverImage(parsed);
    }
    return parseStructuredCover(parsed);
  } catch {
    return {
      card: trimmed,
      list: trimmed,
      background: trimmed,
    };
  }
}

export function getCoverImageUrl(value, variant = 'card') {
  const variants = parseCoverImage(value);
  return variants[variant] || variants.card || variants.list || variants.background || '';
}
