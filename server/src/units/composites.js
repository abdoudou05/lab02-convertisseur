/**
 * Écritures composées : la façon dont un humain énonce réellement une mesure.
 *
 * « 1,75 m » se dit « 5 pi 8 7/8 po » en pieds et pouces, et « 3 661 s » se dit
 * « 1 h 1 min 1 s ». Chaque préréglage liste les unités de la plus grande à la
 * plus petite ; seule la dernière porte une partie fractionnaire.
 *
 * `fraction` indique le dénominateur à utiliser pour la dernière unité lorsque
 * l'affichage fractionnaire est demandé (typiquement le pouce, en seizièmes).
 */
export const COMPOSITES = {
  length: [
    {
      id: 'ft_in',
      name: { fr: 'pieds et pouces', en: 'feet and inches' },
      units: ['ft', 'in'],
      fraction: 16,
    },
    {
      id: 'm_cm_mm',
      name: { fr: 'm, cm et mm', en: 'm, cm and mm' },
      units: ['m', 'cm', 'mm'],
    },
  ],

  mass: [
    { id: 'lb_oz', name: { fr: 'livres et onces', en: 'pounds and ounces' }, units: ['lb', 'oz'] },
    { id: 'st_lb', name: { fr: 'stones et livres', en: 'stones and pounds' }, units: ['st', 'lb'] },
    { id: 'kg_g', name: { fr: 'kg et g', en: 'kg and g' }, units: ['kg', 'g'] },
  ],

  time: [
    { id: 'h_min_s', name: { fr: 'h, min et s', en: 'h, min and s' }, units: ['h', 'min', 's'] },
    { id: 'd_h_min_s', name: { fr: 'j, h, min et s', en: 'd, h, min and s' }, units: ['d', 'h', 'min', 's'] },
  ],

  angle: [
    {
      id: 'dms',
      name: { fr: 'degrés, minutes, secondes', en: 'degrees, minutes, seconds' },
      units: ['deg', 'arcmin', 'arcsec'],
    },
  ],

  volume: [
    {
      id: 'gal_qt_pt_floz',
      name: { fr: 'gallons, pintes, chopines, onces', en: 'gallons, quarts, pints, ounces' },
      units: ['gal_us', 'qt_us', 'pt_us', 'floz_us'],
    },
    { id: 'l_ml', name: { fr: 'L et mL', en: 'L and mL' }, units: ['L', 'mL'] },
  ],
};

/** Liste des préréglages d'une catégorie, ou un tableau vide. */
export const compositesFor = (categoryId) => COMPOSITES[categoryId] ?? [];

/** Préréglage par défaut d'une catégorie, ou null. */
export const defaultComposite = (categoryId) => compositesFor(categoryId)[0] ?? null;

/** Retrouve un préréglage par son identifiant. */
export const findComposite = (categoryId, compositeId) =>
  compositesFor(categoryId).find((preset) => preset.id === compositeId) ?? null;
