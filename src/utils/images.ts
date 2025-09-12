export const PLACEHOLDER_IMAGE_DATA_URL = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150'>
    <rect width='100%' height='100%' fill='#e5e7eb'/>
    <g fill='#9ca3af'>
      <rect x='20' y='20' width='160' height='110' rx='8' ry='8' fill='#d1d5db'/>
      <circle cx='70' cy='65' r='18' fill='#9ca3af'/>
      <path d='M40 110 L90 75 L120 95 L160 55 L180 110 Z' fill='#9ca3af'/>
    </g>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-family='sans-serif' font-size='14'>Sin imagen</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

export function getImageSrc(image: any): string {
  try {
    if (!image) return PLACEHOLDER_IMAGE_DATA_URL;
    if (typeof image !== 'string') return PLACEHOLDER_IMAGE_DATA_URL;

    const trimmed = image.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return PLACEHOLDER_IMAGE_DATA_URL;
    }

    // Si es data URL, validar que tenga datos
    if (trimmed.startsWith('data:')) {
      const commaIndex = trimmed.indexOf(',');
      if (commaIndex === -1) return PLACEHOLDER_IMAGE_DATA_URL;
      const payload = trimmed.slice(commaIndex + 1);
      if (!payload || payload.length < 8) return PLACEHOLDER_IMAGE_DATA_URL; // vacío o inválido
      return trimmed;
    }

    // Si es base64 "puro", normalizar (sin espacios) y prefijar (suponemos jpeg)
    const b64 = trimmed.replace(/\s+/g, '');
    if (!b64 || b64.length < 8) return PLACEHOLDER_IMAGE_DATA_URL;
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return PLACEHOLDER_IMAGE_DATA_URL;
  }
}

