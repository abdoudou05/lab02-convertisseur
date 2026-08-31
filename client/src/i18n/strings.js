/**
 * Chaînes de l'interface. Les noms de catégories et d'unités ne sont PAS ici :
 * ils viennent de l'API, déjà traduits, pour qu'il n'existe qu'une seule
 * source de vérité pour le vocabulaire des unités.
 */
export const STRINGS = {
  fr: {
    locale: 'fr-CA',
    appName: 'Convertisseur',
    tagline: 'Mesures exactes',
    subtitle: 'Conversions calculées en arithmétique décimale exacte, sur 18 catégories et 163 unités.',

    from: 'Depuis',
    to: 'Vers',
    value: 'Valeur',
    result: 'Résultat',
    unit: 'Unité',
    category: 'Catégorie',
    close: 'Fermer',

    swap: 'Inverser les unités',
    copy: 'Copier le résultat',
    copied: 'Copié dans le presse-papiers',
    copyFailed: 'La copie a échoué',
    downloaded: 'Fichier téléchargé',
    precision: 'Précision',

    tabs: {
      convert: 'Convertir',
      batch: 'Par lot',
      table: 'Table',
    },

    allUnits: 'Toutes les unités',
    allUnitsHelp: 'Cliquez sur une ligne pour en faire l’unité de destination.',
    history: 'Historique',
    historyEmpty: 'Vos conversions récentes apparaîtront ici.',
    historyClear: 'Vider l’historique',
    favourites: 'Favoris',
    addFavourite: 'Ajouter aux favoris',
    removeFavourite: 'Retirer des favoris',
    reuse: 'Réutiliser cette conversion',

    scale: 'Ordres de grandeur',
    scaleHelp: 'Chaque unité placée sur une échelle logarithmique. Cliquez un repère pour le choisir.',
    scaleSmall: 'plus petite valeur',
    scaleLarge: 'plus grande valeur',

    composite: 'Écriture composée',
    fractionLabel: 'Fraction',
    expressionChip: 'Expression',
    expressionResult: (value) => `Calculé : ${value}`,

    palette: 'Recherche rapide',
    paletteHint: 'Cherchez une unité, une catégorie ou une action',
    paletteEmpty: 'Aucun résultat',
    paletteOpen: 'Ouvrir la recherche rapide',
    paletteActions: 'Actions',
    paletteCategories: 'Catégories',
    paletteUnits: 'Unités',

    actions: {
      swap: 'Inverser les unités',
      copy: 'Copier le résultat',
      share: 'Copier le lien de partage',
      settings: 'Ouvrir les réglages',
      customUnits: 'Gérer les unités personnalisées',
      theme: 'Changer de thème',
      language: 'Changer de langue',
      print: 'Imprimer',
      clearHistory: 'Vider l’historique',
    },

    share: 'Partager',
    shareCopied: 'Lien copié',
    copyMenu: {
      value: 'La valeur seule',
      valueUnit: 'La valeur et son unité',
      equation: 'L’égalité complète',
      json: 'Les données JSON',
      link: 'Le lien de partage',
    },

    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    language: 'Langue',
    openSettings: 'Réglages',

    settings: {
      title: 'Réglages',
      appearance: 'Apparence',
      numbers: 'Nombres',
      panels: 'Panneaux',
      behaviour: 'Comportement',

      theme: 'Thème',
      accent: 'Couleur d’accentuation',
      density: 'Densité',
      animations: 'Animations',
      animationsHint: 'Désactivez pour une interface entièrement statique.',
      rulerMotif: 'Motif de règle graduée',

      precision: 'Précision',
      precisionMode: 'Mode de précision',
      significant: 'Significatifs',
      decimals: 'Décimales',
      significantHint: 'Nombre de chiffres significatifs conservés.',
      decimalsHint: 'Nombre de chiffres après la virgule.',
      notation: 'Notation',
      rounding: 'Arrondi',
      roundingHint: 'Règle appliquée quand un chiffre tombe pile au milieu.',
      fraction: 'Fractions',
      fractionHint: 'Approche le résultat par une fraction, utile en mesures impériales.',
      grouping: 'Séparateurs de milliers',
      groupingHint: 'Affiche 1 234 567 plutôt que 1234567.',

      showRatio: 'Facteur de conversion',
      showComposite: 'Écriture composée',
      compositeHint: 'Affiche 5 pi 8,9 po au lieu de 5,74 pi.',
      showScale: 'Ordres de grandeur',
      scaleHint: 'Règle logarithmique situant chaque unité.',
      showAllUnits: 'Tableau de toutes les unités',
      showHistory: 'Historique et favoris',

      shortcuts: 'Raccourcis clavier',
      shortcutsHint: 'Les touches simples n’agissent que hors des champs de saisie.',
      historyLimit: 'Conversions mémorisées',

      off: 'Désactivé',
      reset: 'Réinitialiser',
      resetAll: 'Tout réinitialiser',
      storedLocally: 'Vos réglages restent dans ce navigateur.',
    },

    notations: {
      auto: 'Automatique',
      plain: 'Développée',
      scientific: 'Scientifique',
      engineering: 'Ingénieur',
    },

    roundings: {
      'half-up': 'Au plus proche (0,5 monte)',
      'half-even': 'Au plus proche (pair)',
      'half-down': 'Au plus proche (0,5 descend)',
      up: 'Vers le haut',
      down: 'Vers le bas',
      truncate: 'Troncature',
    },

    batch: {
      title: 'Conversion par lot',
      help: 'Collez une valeur par ligne. Les expressions et les deux formats de nombres sont acceptés.',
      input: 'Valeurs',
      run: 'Convertir',
      sample: 'Exemple',
      count: (n) => (n <= 1 ? `${n} valeur` : `${n} valeurs`),
      summary: (ok, total) => `${ok} conversion${ok > 1 ? 's' : ''} sur ${total}`,
      copyCsv: 'Copier',
      rowError: 'Valeur invalide',
    },

    table: {
      title: 'Table de référence',
      help: 'Un aide-mémoire régulier, prêt à imprimer ou à exporter.',
      start: 'Départ',
      step: 'Pas',
      rows: 'Lignes',
      print: 'Imprimer',
    },

    custom: {
      title: 'Unités personnalisées',
      open: 'Unités personnalisées',
      help: (categoryName, baseSymbol) =>
        `Définissez vos propres unités pour la catégorie ${categoryName}. Le facteur exprime la valeur d’une unité en ${baseSymbol}.`,
      id: 'Identifiant',
      symbol: 'Symbole',
      name: 'Nom',
      namePlaceholder: 'Main',
      factor: (baseSymbol) => `Facteur (${baseSymbol})`,
      add: 'Ajouter',
      remove: 'Supprimer',
      existing: (n) => `Vos unités (${n})`,
      empty: 'Aucune unité personnalisée pour cette catégorie.',
      unsupported:
        'Cette catégorie repose sur une échelle avec décalage ou sur un rapport inverse. Un simple facteur ne suffirait pas à la décrire correctement.',
      errorId: 'L’identifiant doit contenir de 1 à 32 lettres, chiffres, tirets ou soulignés.',
      errorFactor: 'Le facteur doit être un nombre strictement positif.',
      errorConflict: 'Cet identifiant est déjà utilisé dans cette catégorie.',
    },

    shortcuts: 'Raccourcis clavier',
    shortcutPalette: 'Recherche rapide',
    shortcutSwap: 'Inverser les unités',
    shortcutCopy: 'Copier le résultat',
    shortcutFocus: 'Aller au champ de saisie',
    shortcutStep: 'Ajuster la valeur (Maj : par 10, Alt : par 0,1)',
    shortcutSettings: 'Ouvrir les réglages',
    shortcutClose: 'Fermer',
    shortcutsNote: 'Les touches simples n’agissent que lorsque le curseur n’est pas dans un champ de saisie.',

    loading: 'Chargement du catalogue',
    offlineTitle: 'API injoignable',
    offlineBody: 'Le serveur Node ne répond pas. Vérifiez qu’il est démarré, puis réessayez.',
    retry: 'Réessayer',

    ratioLabel: 'Facteur',
    systems: {
      si: 'SI',
      metric: 'Métrique',
      imperial: 'Impérial',
      us: 'US',
      custom: 'Personnalisées',
      other: 'Autre',
    },

    footerNote:
      'Facteurs conformes à l’accord international sur le yard et la livre (1959) et à la brochure du SI (BIPM). Calculs en arithmétique décimale à 50 chiffres.',
  },

  en: {
    locale: 'en-CA',
    appName: 'Converter',
    tagline: 'Exact measures',
    subtitle: 'Conversions computed with exact decimal arithmetic, across 18 categories and 163 units.',

    from: 'From',
    to: 'To',
    value: 'Value',
    result: 'Result',
    unit: 'Unit',
    category: 'Category',
    close: 'Close',

    swap: 'Swap units',
    copy: 'Copy result',
    copied: 'Copied to clipboard',
    copyFailed: 'Copy failed',
    downloaded: 'File downloaded',
    precision: 'Precision',

    tabs: {
      convert: 'Convert',
      batch: 'Batch',
      table: 'Table',
    },

    allUnits: 'All units',
    allUnitsHelp: 'Click a row to make it the target unit.',
    history: 'History',
    historyEmpty: 'Your recent conversions will appear here.',
    historyClear: 'Clear history',
    favourites: 'Favourites',
    addFavourite: 'Add to favourites',
    removeFavourite: 'Remove from favourites',
    reuse: 'Reuse this conversion',

    scale: 'Orders of magnitude',
    scaleHelp: 'Every unit placed on a logarithmic scale. Click a tick to select it.',
    scaleSmall: 'smallest value',
    scaleLarge: 'largest value',

    composite: 'Composite reading',
    fractionLabel: 'Fraction',
    expressionChip: 'Expression',
    expressionResult: (value) => `Evaluated: ${value}`,

    palette: 'Quick search',
    paletteHint: 'Search for a unit, a category or an action',
    paletteEmpty: 'No results',
    paletteOpen: 'Open quick search',
    paletteActions: 'Actions',
    paletteCategories: 'Categories',
    paletteUnits: 'Units',

    actions: {
      swap: 'Swap units',
      copy: 'Copy result',
      share: 'Copy share link',
      settings: 'Open settings',
      customUnits: 'Manage custom units',
      theme: 'Toggle theme',
      language: 'Switch language',
      print: 'Print',
      clearHistory: 'Clear history',
    },

    share: 'Share',
    shareCopied: 'Link copied',
    copyMenu: {
      value: 'Value only',
      valueUnit: 'Value with unit',
      equation: 'Full equation',
      json: 'JSON data',
      link: 'Share link',
    },

    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    openSettings: 'Settings',

    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      numbers: 'Numbers',
      panels: 'Panels',
      behaviour: 'Behaviour',

      theme: 'Theme',
      accent: 'Accent colour',
      density: 'Density',
      animations: 'Animations',
      animationsHint: 'Turn off for a completely static interface.',
      rulerMotif: 'Ruler motif',

      precision: 'Precision',
      precisionMode: 'Precision mode',
      significant: 'Significant',
      decimals: 'Decimals',
      significantHint: 'Number of significant digits kept.',
      decimalsHint: 'Number of digits after the decimal point.',
      notation: 'Notation',
      rounding: 'Rounding',
      roundingHint: 'Rule applied when a digit falls exactly halfway.',
      fraction: 'Fractions',
      fractionHint: 'Approximates the result as a fraction, useful for imperial measures.',
      grouping: 'Thousands separators',
      groupingHint: 'Shows 1,234,567 rather than 1234567.',

      showRatio: 'Conversion factor',
      showComposite: 'Composite reading',
      compositeHint: 'Shows 5 ft 8.9 in instead of 5.74 ft.',
      showScale: 'Orders of magnitude',
      scaleHint: 'Logarithmic ruler placing every unit.',
      showAllUnits: 'All units table',
      showHistory: 'History and favourites',

      shortcuts: 'Keyboard shortcuts',
      shortcutsHint: 'Single-key shortcuts only apply outside input fields.',
      historyLimit: 'Conversions remembered',

      off: 'Off',
      reset: 'Reset',
      resetAll: 'Reset everything',
      storedLocally: 'Your settings stay in this browser.',
    },

    notations: {
      auto: 'Automatic',
      plain: 'Plain',
      scientific: 'Scientific',
      engineering: 'Engineering',
    },

    roundings: {
      'half-up': 'Nearest (0.5 up)',
      'half-even': 'Nearest (even)',
      'half-down': 'Nearest (0.5 down)',
      up: 'Toward positive',
      down: 'Toward negative',
      truncate: 'Truncate',
    },

    batch: {
      title: 'Batch conversion',
      help: 'Paste one value per line. Expressions and both number formats are accepted.',
      input: 'Values',
      run: 'Convert',
      sample: 'Sample',
      count: (n) => (n <= 1 ? `${n} value` : `${n} values`),
      summary: (ok, total) => `${ok} of ${total} converted`,
      copyCsv: 'Copy',
      rowError: 'Invalid value',
    },

    table: {
      title: 'Reference table',
      help: 'A regular cheat sheet, ready to print or export.',
      start: 'Start',
      step: 'Step',
      rows: 'Rows',
      print: 'Print',
    },

    custom: {
      title: 'Custom units',
      open: 'Custom units',
      help: (categoryName, baseSymbol) =>
        `Define your own units for the ${categoryName} category. The factor expresses one unit in ${baseSymbol}.`,
      id: 'Identifier',
      symbol: 'Symbol',
      name: 'Name',
      namePlaceholder: 'Hand',
      factor: (baseSymbol) => `Factor (${baseSymbol})`,
      add: 'Add',
      remove: 'Remove',
      existing: (n) => `Your units (${n})`,
      empty: 'No custom units in this category yet.',
      unsupported:
        'This category uses an offset scale or an inverse relationship. A plain factor could not describe it correctly.',
      errorId: 'The identifier must be 1 to 32 letters, digits, hyphens or underscores.',
      errorFactor: 'The factor must be a strictly positive number.',
      errorConflict: 'That identifier is already used in this category.',
    },

    shortcuts: 'Keyboard shortcuts',
    shortcutPalette: 'Quick search',
    shortcutSwap: 'Swap units',
    shortcutCopy: 'Copy result',
    shortcutFocus: 'Focus the input field',
    shortcutStep: 'Adjust the value (Shift: by 10, Alt: by 0.1)',
    shortcutSettings: 'Open settings',
    shortcutClose: 'Close',
    shortcutsNote: 'Single-key shortcuts only apply when the cursor is not inside an input field.',

    loading: 'Loading the catalogue',
    offlineTitle: 'API unreachable',
    offlineBody: 'The Node server is not responding. Make sure it is running, then try again.',
    retry: 'Retry',

    ratioLabel: 'Factor',
    systems: {
      si: 'SI',
      metric: 'Metric',
      imperial: 'Imperial',
      us: 'US',
      custom: 'Custom',
      other: 'Other',
    },

    footerNote:
      'Factors follow the 1959 international yard and pound agreement and the SI Brochure (BIPM). Computed with 50-digit decimal arithmetic.',
  },
};

export const LANGUAGES = [
  { id: 'fr', label: 'Français', short: 'FR' },
  { id: 'en', label: 'English', short: 'EN' },
];
