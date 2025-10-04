export const ASPECTS = [
  { key: 'square', label: 'Square', size: { w: 1080, h: 1080 } },
  { key: 'portrait', label: 'Portrait', size: { w: 1080, h: 1350 } },
  { key: 'story', label: 'Story', size: { w: 1080, h: 1920 } },
] as const;

export type AspectKey = (typeof ASPECTS)[number]['key'];

export const NATIVE_BY_KEY: Record<AspectKey, { w: number; h: number }> = Object.fromEntries(
  ASPECTS.map((a) => [a.key, a.size])
) as Record<AspectKey, { w: number; h: number }>;
