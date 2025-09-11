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

export function getImageSrc(image: string | null | undefined): string {
  if (!image) return PLACEHOLDER_IMAGE_DATA_URL;
  // Si ya viene como data URL, usarla; si es base64 pura, prefix por defecto jpeg
  if (image.startsWith('data:')) return image;
  return `data:image/jpeg;base64,${image}`;
}

