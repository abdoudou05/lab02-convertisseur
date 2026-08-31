/**
 * Modèle de réglages de l'application.
 *
 * Un seul objet, persisté dans localStorage, fusionné avec les valeurs par
 * défaut à la lecture : ajouter un réglage plus tard ne casse donc jamais une
 * préférence déjà enregistrée.
 */

export const ACCENTS = [
  { id: 'teal', label: { fr: 'Sarcelle', en: 'Teal' } },
  { id: 'indigo', label: { fr: 'Indigo', en: 'Indigo' } },
  { id: 'amber', label: { fr: 'Ambre', en: 'Amber' } },
  { id: 'rose', label: { fr: 'Rose', en: 'Rose' } },
  { id: 'violet', label: { fr: 'Violet', en: 'Violet' } },
  { id: 'forest', label: { fr: 'Forêt', en: 'Forest' } },
];

export const DENSITIES = [
  { id: 'compact', label: { fr: 'Compacte', en: 'Compact' } },
  { id: 'cozy', label: { fr: 'Normale', en: 'Cozy' } },
  { id: 'comfortable', label: { fr: 'Aérée', en: 'Comfortable' } },
];

export const THEMES = [
  { id: 'system', label: { fr: 'Système', en: 'System' } },
  { id: 'light', label: { fr: 'Clair', en: 'Light' } },
  { id: 'dark', label: { fr: 'Sombre', en: 'Dark' } },
];

export const DEFAULT_SETTINGS = {
  // Apparence
  theme: 'system',
  accent: 'teal',
  density: 'cozy',
  animations: true,
  rulerMotif: true,

  // Nombres
  precision: 6,
  precisionMode: 'significant',
  notation: 'auto',
  rounding: 'half-up',
  grouping: true,
  fraction: null,

  // Panneaux
  showComposite: true,
  showScale: true,
  showAllUnits: true,
  showHistory: true,
  showRatio: true,

  // Comportement
  shortcuts: true,
  liveConvert: true,
  historyLimit: 12,
};

/** Fusionne des réglages enregistrés avec les valeurs par défaut. */
export function mergeSettings(stored) {
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_SETTINGS };
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (stored[key] !== undefined) merged[key] = stored[key];
  }
  return merged;
}

/** Réglages transmis à l'API pour une conversion. */
export const conversionOptions = (settings) => ({
  precision: settings.precision,
  precisionMode: settings.precisionMode,
  notation: settings.notation,
  rounding: settings.rounding,
  fraction: settings.fraction ?? undefined,
  composite: settings.showComposite ? 'auto' : 'none',
});
