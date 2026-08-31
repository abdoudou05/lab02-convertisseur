import {
  D, PI,
  INCH_M, FOOT_M, YARD_M, MILE_M, NAUTICAL_MILE_M, LIGHT_YEAR_M, AU_M,
  POUND_KG, OUNCE_KG, GRAIN_KG,
  GALLON_US_L, GALLON_UK_L,
  LBF_N, ATM_PA, MMHG_PA,
  CAL_TH_J, BTU_IT_J, EV_J, C_MS,
  GREGORIAN_MONTH_S, GREGORIAN_YEAR_S,
} from './constants.js';
import { EXTENDED_CATEGORIES } from './categories-extended.js';

/**
 * Modèle de données
 * -----------------
 * Chaque catégorie déclare une unité de BASE et exprime toutes ses unités par
 * rapport à celle-ci.
 *
 *   kind: 'affine'      base = valeur × factor + offset
 *                       (couvre le cas linéaire, où offset vaut 0, et les
 *                       échelles de température, qui ont un décalage réel)
 *
 *   kind: 'reciprocal'  unités « direct »  : base = valeur × factor
 *                       unités « inverse » : base = constant ÷ valeur
 *
 * `symbol` accepte une chaîne (identique dans les deux langues) ou un objet
 * { fr, en } lorsque la notation diffère réellement (octet ⇄ byte).
 */

const CORE_CATEGORIES = [
  // -------------------------------------------------------------------------
  {
    id: 'length',
    icon: 'straighten',
    name: { fr: 'Longueur', en: 'Length' },
    blurb: {
      fr: 'Du nanomètre à l’année-lumière.',
      en: 'From the nanometre to the light-year.',
    },
    base: 'm',
    kind: 'affine',
    defaultPair: ['ft', 'm'],
    units: [
      { id: 'nm', symbol: 'nm', system: 'si', name: { fr: 'nanomètre', en: 'nanometre' }, factor: D('1e-9') },
      { id: 'um', symbol: 'µm', system: 'si', name: { fr: 'micromètre', en: 'micrometre' }, factor: D('1e-6') },
      { id: 'mm', symbol: 'mm', system: 'si', name: { fr: 'millimètre', en: 'millimetre' }, factor: D('0.001') },
      { id: 'cm', symbol: 'cm', system: 'si', name: { fr: 'centimètre', en: 'centimetre' }, factor: D('0.01') },
      { id: 'm', symbol: 'm', system: 'si', name: { fr: 'mètre', en: 'metre' }, factor: D(1) },
      { id: 'km', symbol: 'km', system: 'si', name: { fr: 'kilomètre', en: 'kilometre' }, factor: D(1000) },
      { id: 'in', symbol: 'po', system: 'imperial', name: { fr: 'pouce', en: 'inch' }, factor: INCH_M },
      { id: 'ft', symbol: 'pi', system: 'imperial', name: { fr: 'pied', en: 'foot' }, factor: FOOT_M },
      { id: 'yd', symbol: 'vg', system: 'imperial', name: { fr: 'verge', en: 'yard' }, factor: YARD_M },
      { id: 'mi', symbol: 'mi', system: 'imperial', name: { fr: 'mille terrestre', en: 'mile' }, factor: MILE_M },
      { id: 'nmi', symbol: 'M', system: 'other', name: { fr: 'mille marin', en: 'nautical mile' }, factor: NAUTICAL_MILE_M },
      { id: 'au', symbol: 'ua', system: 'other', name: { fr: 'unité astronomique', en: 'astronomical unit' }, factor: AU_M },
      {
        id: 'ly', symbol: 'al', system: 'other',
        name: { fr: 'année-lumière', en: 'light-year' }, factor: LIGHT_YEAR_M,
        note: {
          fr: 'Basée sur l’année julienne de 365,25 jours (UAI).',
          en: 'Based on the 365.25-day Julian year (IAU).',
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'mass',
    icon: 'scale',
    name: { fr: 'Masse', en: 'Mass' },
    blurb: {
      fr: 'Système international et avoirdupois.',
      en: 'Metric and avoirdupois systems.',
    },
    base: 'kg',
    kind: 'affine',
    defaultPair: ['lb', 'kg'],
    units: [
      { id: 'mg', symbol: 'mg', system: 'si', name: { fr: 'milligramme', en: 'milligram' }, factor: D('1e-6') },
      { id: 'g', symbol: 'g', system: 'si', name: { fr: 'gramme', en: 'gram' }, factor: D('0.001') },
      { id: 'kg', symbol: 'kg', system: 'si', name: { fr: 'kilogramme', en: 'kilogram' }, factor: D(1) },
      { id: 't', symbol: 't', system: 'si', name: { fr: 'tonne', en: 'tonne' }, factor: D(1000) },
      { id: 'ct', symbol: 'ct', system: 'other', name: { fr: 'carat métrique', en: 'metric carat' }, factor: D('0.0002') },
      { id: 'gr', symbol: 'gr', system: 'imperial', name: { fr: 'grain', en: 'grain' }, factor: GRAIN_KG },
      { id: 'oz', symbol: 'oz', system: 'imperial', name: { fr: 'once', en: 'ounce' }, factor: OUNCE_KG },
      { id: 'lb', symbol: 'lb', system: 'imperial', name: { fr: 'livre', en: 'pound' }, factor: POUND_KG },
      { id: 'st', symbol: 'st', system: 'imperial', name: { fr: 'stone', en: 'stone' }, factor: POUND_KG.times(14) },
      { id: 'ton_us', symbol: 'tc', system: 'us', name: { fr: 'tonne courte (US)', en: 'short ton (US)' }, factor: POUND_KG.times(2000) },
      { id: 'ton_uk', symbol: 'tl', system: 'imperial', name: { fr: 'tonne longue (imp.)', en: 'long ton (imp.)' }, factor: POUND_KG.times(2240) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'volume',
    icon: 'local_drink',
    name: { fr: 'Volume', en: 'Volume' },
    blurb: {
      fr: 'Mesures usuelles, américaines et impériales.',
      en: 'Metric, US and imperial measures.',
    },
    base: 'L',
    kind: 'affine',
    defaultPair: ['L', 'gal_us'],
    units: [
      { id: 'mL', symbol: 'mL', system: 'si', name: { fr: 'millilitre', en: 'millilitre' }, factor: D('0.001') },
      { id: 'L', symbol: 'L', system: 'si', name: { fr: 'litre', en: 'litre' }, factor: D(1) },
      { id: 'm3', symbol: 'm³', system: 'si', name: { fr: 'mètre cube', en: 'cubic metre' }, factor: D(1000) },
      {
        id: 'cup_metric', symbol: 'tasse', system: 'other',
        name: { fr: 'tasse métrique', en: 'metric cup' }, factor: D('0.25'),
        note: { fr: 'Tasse métrique canadienne de 250 mL.', en: 'Canadian metric cup of 250 mL.' },
      },
      { id: 'tsp_us', symbol: 'c. à thé US', system: 'us', name: { fr: 'cuillère à thé (US)', en: 'teaspoon (US)' }, factor: GALLON_US_L.div(768) },
      { id: 'tbsp_us', symbol: 'c. à soupe US', system: 'us', name: { fr: 'cuillère à soupe (US)', en: 'tablespoon (US)' }, factor: GALLON_US_L.div(256) },
      { id: 'floz_us', symbol: 'oz liq. US', system: 'us', name: { fr: 'once liquide (US)', en: 'fluid ounce (US)' }, factor: GALLON_US_L.div(128) },
      { id: 'cup_us', symbol: 'tasse US', system: 'us', name: { fr: 'tasse (US)', en: 'cup (US)' }, factor: GALLON_US_L.div(16) },
      { id: 'pt_us', symbol: 'chop. US', system: 'us', name: { fr: 'chopine (US)', en: 'pint (US)' }, factor: GALLON_US_L.div(8) },
      { id: 'qt_us', symbol: 'pte US', system: 'us', name: { fr: 'pinte (US)', en: 'quart (US)' }, factor: GALLON_US_L.div(4) },
      { id: 'gal_us', symbol: 'gal US', system: 'us', name: { fr: 'gallon (US)', en: 'gallon (US)' }, factor: GALLON_US_L },
      { id: 'floz_uk', symbol: 'oz liq. imp.', system: 'imperial', name: { fr: 'once liquide (imp.)', en: 'fluid ounce (imp.)' }, factor: GALLON_UK_L.div(160) },
      { id: 'gal_uk', symbol: 'gal imp.', system: 'imperial', name: { fr: 'gallon impérial', en: 'gallon (imp.)' }, factor: GALLON_UK_L },
      { id: 'ft3', symbol: 'pi³', system: 'imperial', name: { fr: 'pied cube', en: 'cubic foot' }, factor: FOOT_M.pow(3).times(1000) },
      {
        id: 'bbl', symbol: 'bbl', system: 'other',
        name: { fr: 'baril de pétrole', en: 'oil barrel' }, factor: GALLON_US_L.times(42),
        note: { fr: 'Baril pétrolier de 42 gallons US.', en: '42-US-gallon petroleum barrel.' },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'temperature',
    icon: 'thermostat',
    name: { fr: 'Température', en: 'Temperature' },
    blurb: {
      fr: 'Échelles affines : un décalage, pas seulement un facteur.',
      en: 'Affine scales: an offset, not just a factor.',
    },
    base: 'K',
    kind: 'affine',
    defaultPair: ['C', 'F'],
    // Le zéro absolu (0 K) borne physiquement cette catégorie.
    absoluteFloor: true,
    units: [
      { id: 'K', symbol: 'K', system: 'si', name: { fr: 'kelvin', en: 'kelvin' }, factor: D(1), offset: D(0) },
      { id: 'C', symbol: '°C', system: 'si', name: { fr: 'degré Celsius', en: 'degree Celsius' }, factor: D(1), offset: D('273.15') },
      {
        id: 'F', symbol: '°F', system: 'us',
        name: { fr: 'degré Fahrenheit', en: 'degree Fahrenheit' },
        // K = (°F − 32) × 5/9 + 273,15  ⇒  facteur 5/9, décalage 273,15 − 160/9
        factor: D(5).div(9), offset: D('273.15').minus(D(160).div(9)),
      },
      { id: 'R', symbol: '°R', system: 'us', name: { fr: 'degré Rankine', en: 'degree Rankine' }, factor: D(5).div(9), offset: D(0) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'area',
    icon: 'crop_free',
    name: { fr: 'Superficie', en: 'Area' },
    blurb: { fr: 'Du centimètre carré au mille carré.', en: 'From square centimetre to square mile.' },
    base: 'm2',
    kind: 'affine',
    defaultPair: ['ft2', 'm2'],
    units: [
      { id: 'mm2', symbol: 'mm²', system: 'si', name: { fr: 'millimètre carré', en: 'square millimetre' }, factor: D('1e-6') },
      { id: 'cm2', symbol: 'cm²', system: 'si', name: { fr: 'centimètre carré', en: 'square centimetre' }, factor: D('1e-4') },
      { id: 'm2', symbol: 'm²', system: 'si', name: { fr: 'mètre carré', en: 'square metre' }, factor: D(1) },
      { id: 'ha', symbol: 'ha', system: 'si', name: { fr: 'hectare', en: 'hectare' }, factor: D(10000) },
      { id: 'km2', symbol: 'km²', system: 'si', name: { fr: 'kilomètre carré', en: 'square kilometre' }, factor: D('1e6') },
      { id: 'in2', symbol: 'po²', system: 'imperial', name: { fr: 'pouce carré', en: 'square inch' }, factor: INCH_M.pow(2) },
      { id: 'ft2', symbol: 'pi²', system: 'imperial', name: { fr: 'pied carré', en: 'square foot' }, factor: FOOT_M.pow(2) },
      { id: 'yd2', symbol: 'vg²', system: 'imperial', name: { fr: 'verge carrée', en: 'square yard' }, factor: YARD_M.pow(2) },
      { id: 'ac', symbol: 'ac', system: 'imperial', name: { fr: 'acre', en: 'acre' }, factor: YARD_M.pow(2).times(4840) },
      { id: 'mi2', symbol: 'mi²', system: 'imperial', name: { fr: 'mille carré', en: 'square mile' }, factor: MILE_M.pow(2) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'speed',
    icon: 'speed',
    name: { fr: 'Vitesse', en: 'Speed' },
    blurb: { fr: 'Du pas de course à la vitesse de la lumière.', en: 'From a jog to the speed of light.' },
    base: 'm_s',
    kind: 'affine',
    defaultPair: ['kmh', 'mph'],
    units: [
      { id: 'm_s', symbol: 'm/s', system: 'si', name: { fr: 'mètre par seconde', en: 'metre per second' }, factor: D(1) },
      { id: 'kmh', symbol: 'km/h', system: 'si', name: { fr: 'kilomètre par heure', en: 'kilometre per hour' }, factor: D(1000).div(3600) },
      { id: 'ft_s', symbol: 'pi/s', system: 'imperial', name: { fr: 'pied par seconde', en: 'foot per second' }, factor: FOOT_M },
      { id: 'mph', symbol: 'mi/h', system: 'imperial', name: { fr: 'mille par heure', en: 'mile per hour' }, factor: MILE_M.div(3600) },
      { id: 'kn', symbol: 'nd', system: 'other', name: { fr: 'nœud', en: 'knot' }, factor: NAUTICAL_MILE_M.div(3600) },
      {
        id: 'c', symbol: 'c', system: 'other',
        name: { fr: 'vitesse de la lumière', en: 'speed of light' }, factor: C_MS,
        note: { fr: 'Constante exacte du SI : 299 792 458 m/s.', en: 'Exact SI constant: 299 792 458 m/s.' },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'time',
    icon: 'schedule',
    name: { fr: 'Temps', en: 'Time' },
    blurb: { fr: 'Durées, de la nanoseconde à l’année.', en: 'Durations, from nanosecond to year.' },
    base: 's',
    kind: 'affine',
    defaultPair: ['h', 'min'],
    units: [
      { id: 'ns', symbol: 'ns', system: 'si', name: { fr: 'nanoseconde', en: 'nanosecond' }, factor: D('1e-9') },
      { id: 'us', symbol: 'µs', system: 'si', name: { fr: 'microseconde', en: 'microsecond' }, factor: D('1e-6') },
      { id: 'ms', symbol: 'ms', system: 'si', name: { fr: 'milliseconde', en: 'millisecond' }, factor: D('0.001') },
      { id: 's', symbol: 's', system: 'si', name: { fr: 'seconde', en: 'second' }, factor: D(1) },
      { id: 'min', symbol: 'min', system: 'si', name: { fr: 'minute', en: 'minute' }, factor: D(60) },
      { id: 'h', symbol: 'h', system: 'si', name: { fr: 'heure', en: 'hour' }, factor: D(3600) },
      { id: 'd', symbol: 'j', system: 'si', name: { fr: 'jour', en: 'day' }, factor: D(86400) },
      { id: 'wk', symbol: 'sem.', system: 'other', name: { fr: 'semaine', en: 'week' }, factor: D(604800) },
      {
        id: 'mo', symbol: 'mois', system: 'other',
        name: { fr: 'mois moyen', en: 'mean month' }, factor: GREGORIAN_MONTH_S,
        note: { fr: 'Mois grégorien moyen = 30,436875 jours.', en: 'Mean Gregorian month = 30.436875 days.' },
      },
      {
        id: 'a', symbol: 'a', system: 'other',
        name: { fr: 'année moyenne', en: 'mean year' }, factor: GREGORIAN_YEAR_S,
        note: { fr: 'Année grégorienne moyenne = 365,2425 jours.', en: 'Mean Gregorian year = 365.2425 days.' },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'pressure',
    icon: 'compress',
    name: { fr: 'Pression', en: 'Pressure' },
    blurb: { fr: 'Météo, plongée, pneus et vide.', en: 'Weather, diving, tyres and vacuum.' },
    base: 'Pa',
    kind: 'affine',
    defaultPair: ['psi', 'kPa'],
    units: [
      { id: 'Pa', symbol: 'Pa', system: 'si', name: { fr: 'pascal', en: 'pascal' }, factor: D(1) },
      { id: 'hPa', symbol: 'hPa', system: 'si', name: { fr: 'hectopascal', en: 'hectopascal' }, factor: D(100) },
      { id: 'kPa', symbol: 'kPa', system: 'si', name: { fr: 'kilopascal', en: 'kilopascal' }, factor: D(1000) },
      { id: 'MPa', symbol: 'MPa', system: 'si', name: { fr: 'mégapascal', en: 'megapascal' }, factor: D('1e6') },
      { id: 'bar', symbol: 'bar', system: 'other', name: { fr: 'bar', en: 'bar' }, factor: D(100000) },
      { id: 'atm', symbol: 'atm', system: 'other', name: { fr: 'atmosphère normale', en: 'standard atmosphere' }, factor: ATM_PA },
      { id: 'psi', symbol: 'lb/po²', system: 'imperial', name: { fr: 'livre par pouce carré', en: 'pound per square inch' }, factor: LBF_N.div(INCH_M.pow(2)) },
      {
        id: 'torr', symbol: 'Torr', system: 'other',
        name: { fr: 'torr', en: 'torr' }, factor: ATM_PA.div(760),
        note: {
          fr: 'Exactement 1/760 atm, très légèrement différent du mmHg.',
          en: 'Exactly 1/760 atm, marginally different from the mmHg.',
        },
      },
      {
        id: 'mmHg', symbol: 'mmHg', system: 'other',
        name: { fr: 'millimètre de mercure', en: 'millimetre of mercury' }, factor: MMHG_PA,
        note: { fr: 'Valeur conventionnelle : 133,322387415 Pa.', en: 'Conventional value: 133.322387415 Pa.' },
      },
      { id: 'inHg', symbol: 'poHg', system: 'imperial', name: { fr: 'pouce de mercure', en: 'inch of mercury' }, factor: MMHG_PA.times('25.4') },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'energy',
    icon: 'bolt',
    name: { fr: 'Énergie', en: 'Energy' },
    blurb: { fr: 'Facture d’électricité, nutrition et physique.', en: 'Utility bills, nutrition and physics.' },
    base: 'J',
    kind: 'affine',
    defaultPair: ['kWh', 'MJ'],
    units: [
      { id: 'J', symbol: 'J', system: 'si', name: { fr: 'joule', en: 'joule' }, factor: D(1) },
      { id: 'kJ', symbol: 'kJ', system: 'si', name: { fr: 'kilojoule', en: 'kilojoule' }, factor: D(1000) },
      { id: 'MJ', symbol: 'MJ', system: 'si', name: { fr: 'mégajoule', en: 'megajoule' }, factor: D('1e6') },
      { id: 'Wh', symbol: 'Wh', system: 'si', name: { fr: 'wattheure', en: 'watt-hour' }, factor: D(3600) },
      { id: 'kWh', symbol: 'kWh', system: 'si', name: { fr: 'kilowattheure', en: 'kilowatt-hour' }, factor: D('3.6e6') },
      {
        id: 'cal', symbol: 'cal', system: 'other',
        name: { fr: 'calorie', en: 'calorie' }, factor: CAL_TH_J,
        note: { fr: 'Calorie thermochimique : 4,184 J.', en: 'Thermochemical calorie: 4.184 J.' },
      },
      {
        id: 'kcal', symbol: 'kcal', system: 'other',
        name: { fr: 'kilocalorie', en: 'kilocalorie' }, factor: CAL_TH_J.times(1000),
        note: { fr: 'La « Calorie » des étiquettes alimentaires.', en: 'The dietary “Calorie” on food labels.' },
      },
      { id: 'BTU', symbol: 'BTU', system: 'imperial', name: { fr: 'British thermal unit', en: 'British thermal unit' }, factor: BTU_IT_J },
      { id: 'ftlb', symbol: 'pi·lbf', system: 'imperial', name: { fr: 'pied-livre force', en: 'foot-pound force' }, factor: LBF_N.times(FOOT_M) },
      { id: 'eV', symbol: 'eV', system: 'si', name: { fr: 'électronvolt', en: 'electronvolt' }, factor: EV_J },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'power',
    icon: 'power',
    name: { fr: 'Puissance', en: 'Power' },
    blurb: { fr: 'Moteurs, appareils et chauffage.', en: 'Engines, appliances and heating.' },
    base: 'W',
    kind: 'affine',
    defaultPair: ['hp', 'kW'],
    units: [
      { id: 'W', symbol: 'W', system: 'si', name: { fr: 'watt', en: 'watt' }, factor: D(1) },
      { id: 'kW', symbol: 'kW', system: 'si', name: { fr: 'kilowatt', en: 'kilowatt' }, factor: D(1000) },
      { id: 'MW', symbol: 'MW', system: 'si', name: { fr: 'mégawatt', en: 'megawatt' }, factor: D('1e6') },
      {
        id: 'hp', symbol: 'hp', system: 'imperial',
        name: { fr: 'cheval-vapeur impérial', en: 'mechanical horsepower' },
        factor: LBF_N.times(FOOT_M).times(550),
        note: { fr: '550 pi·lbf/s, le « horsepower » nord-américain.', en: '550 ft·lbf/s, the North American horsepower.' },
      },
      {
        id: 'ch', symbol: 'ch', system: 'other',
        name: { fr: 'cheval-vapeur métrique', en: 'metric horsepower' }, factor: D('735.49875'),
        note: { fr: '75 kgf·m/s, le « PS » européen.', en: '75 kgf·m/s, the European PS.' },
      },
      { id: 'btu_h', symbol: 'BTU/h', system: 'imperial', name: { fr: 'BTU par heure', en: 'BTU per hour' }, factor: BTU_IT_J.div(3600) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'data',
    icon: 'storage',
    name: { fr: 'Données numériques', en: 'Digital storage' },
    blurb: {
      fr: 'Préfixes décimaux (ko) et binaires (Kio), ils ne sont pas équivalents.',
      en: 'Decimal (kB) and binary (KiB) prefixes, they are not the same thing.',
    },
    base: 'B',
    kind: 'affine',
    defaultPair: ['GB', 'GiB'],
    units: [
      { id: 'bit', symbol: 'bit', system: 'si', name: { fr: 'bit', en: 'bit' }, factor: D('0.125') },
      { id: 'B', symbol: { fr: 'o', en: 'B' }, system: 'si', name: { fr: 'octet', en: 'byte' }, factor: D(1) },
      { id: 'kB', symbol: { fr: 'ko', en: 'kB' }, system: 'si', name: { fr: 'kilooctet', en: 'kilobyte' }, factor: D(1000) },
      { id: 'MB', symbol: { fr: 'Mo', en: 'MB' }, system: 'si', name: { fr: 'mégaoctet', en: 'megabyte' }, factor: D('1e6') },
      { id: 'GB', symbol: { fr: 'Go', en: 'GB' }, system: 'si', name: { fr: 'gigaoctet', en: 'gigabyte' }, factor: D('1e9') },
      { id: 'TB', symbol: { fr: 'To', en: 'TB' }, system: 'si', name: { fr: 'téraoctet', en: 'terabyte' }, factor: D('1e12') },
      { id: 'PB', symbol: { fr: 'Po', en: 'PB' }, system: 'si', name: { fr: 'pétaoctet', en: 'petabyte' }, factor: D('1e15') },
      { id: 'KiB', symbol: { fr: 'Kio', en: 'KiB' }, system: 'other', name: { fr: 'kibioctet', en: 'kibibyte' }, factor: D(1024) },
      { id: 'MiB', symbol: { fr: 'Mio', en: 'MiB' }, system: 'other', name: { fr: 'mébioctet', en: 'mebibyte' }, factor: D(1024).pow(2) },
      { id: 'GiB', symbol: { fr: 'Gio', en: 'GiB' }, system: 'other', name: { fr: 'gibioctet', en: 'gibibyte' }, factor: D(1024).pow(3) },
      { id: 'TiB', symbol: { fr: 'Tio', en: 'TiB' }, system: 'other', name: { fr: 'tébioctet', en: 'tebibyte' }, factor: D(1024).pow(4) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'angle',
    icon: 'architecture',
    name: { fr: 'Angle', en: 'Angle' },
    blurb: { fr: 'Radians, degrés, grades et tours.', en: 'Radians, degrees, gradians and turns.' },
    base: 'rad',
    kind: 'affine',
    defaultPair: ['deg', 'rad'],
    units: [
      { id: 'rad', symbol: 'rad', system: 'si', name: { fr: 'radian', en: 'radian' }, factor: D(1) },
      { id: 'mrad', symbol: 'mrad', system: 'si', name: { fr: 'milliradian', en: 'milliradian' }, factor: D('0.001') },
      { id: 'deg', symbol: '°', system: 'si', name: { fr: 'degré', en: 'degree' }, factor: PI.div(180) },
      { id: 'arcmin', symbol: '′', system: 'other', name: { fr: 'minute d’arc', en: 'arcminute' }, factor: PI.div(10800) },
      { id: 'arcsec', symbol: '″', system: 'other', name: { fr: 'seconde d’arc', en: 'arcsecond' }, factor: PI.div(648000) },
      { id: 'gon', symbol: 'gon', system: 'other', name: { fr: 'grade', en: 'gradian' }, factor: PI.div(200) },
      { id: 'turn', symbol: 'tr', system: 'other', name: { fr: 'tour', en: 'turn' }, factor: PI.times(2) },
    ],
  },
];

/**
 * Catalogue complet : les catégories fondamentales, puis les catégories
 * additionnelles. L'ordre de ce tableau est celui de la barre de catégories.
 */
export const CATEGORIES = [...CORE_CATEGORIES, ...EXTENDED_CATEGORIES];

/** Index O(1) : identifiant de catégorie → catégorie. */
export const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

/** Index O(1) : `${categoryId}:${unitId}` → unité. */
export const UNIT_INDEX = new Map();
for (const category of CATEGORIES) {
  for (const unit of category.units) {
    UNIT_INDEX.set(`${category.id}:${unit.id}`, unit);
  }
}

export const getCategory = (categoryId) => CATEGORY_BY_ID.get(categoryId) ?? null;
export const getUnit = (categoryId, unitId) => UNIT_INDEX.get(`${categoryId}:${unitId}`) ?? null;
