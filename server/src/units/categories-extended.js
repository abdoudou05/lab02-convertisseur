import {
  D, PI,
  INCH_M, FOOT_M, MILE_M,
  POUND_KG, GALLON_US_L, GALLON_UK_L,
  LBF_N, G_N,
} from './constants.js';

/** Mille terrestre exprimé en kilomètres, pour les consommations. */
const MILE_KM = MILE_M.div(1000);

/**
 * Catégories additionnelles. Séparées du premier jeu uniquement pour garder
 * des fichiers lisibles : le modèle de données est strictement le même.
 */
export const EXTENDED_CATEGORIES = [
  // -------------------------------------------------------------------------
  {
    id: 'force',
    icon: 'fitness_center',
    name: { fr: 'Force', en: 'Force' },
    blurb: { fr: 'Newtons, kilogrammes-force et livres-force.', en: 'Newtons, kilograms-force and pounds-force.' },
    base: 'N',
    kind: 'affine',
    defaultPair: ['lbf', 'N'],
    units: [
      { id: 'mN', symbol: 'mN', system: 'si', name: { fr: 'millinewton', en: 'millinewton' }, factor: D('0.001') },
      { id: 'N', symbol: 'N', system: 'si', name: { fr: 'newton', en: 'newton' }, factor: D(1) },
      { id: 'daN', symbol: 'daN', system: 'si', name: { fr: 'décanewton', en: 'decanewton' }, factor: D(10) },
      { id: 'kN', symbol: 'kN', system: 'si', name: { fr: 'kilonewton', en: 'kilonewton' }, factor: D(1000) },
      { id: 'dyn', symbol: 'dyn', system: 'other', name: { fr: 'dyne', en: 'dyne' }, factor: D('1e-5') },
      {
        id: 'kgf', symbol: 'kgf', system: 'other',
        name: { fr: 'kilogramme-force', en: 'kilogram-force' }, factor: G_N,
        note: { fr: 'Poids d’un kilogramme sous la pesanteur normale.', en: 'Weight of one kilogram under standard gravity.' },
      },
      { id: 'ozf', symbol: 'ozf', system: 'imperial', name: { fr: 'once-force', en: 'ounce-force' }, factor: LBF_N.div(16) },
      { id: 'lbf', symbol: 'lbf', system: 'imperial', name: { fr: 'livre-force', en: 'pound-force' }, factor: LBF_N },
      { id: 'kip', symbol: 'kip', system: 'imperial', name: { fr: 'kip', en: 'kip' }, factor: LBF_N.times(1000) },
      {
        id: 'pdl', symbol: 'pdl', system: 'imperial',
        name: { fr: 'poundal', en: 'poundal' }, factor: POUND_KG.times(FOOT_M),
        note: { fr: 'Une livre accélérée d’un pied par seconde carrée.', en: 'One pound accelerated at one foot per second squared.' },
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'torque',
    icon: 'settings',
    name: { fr: 'Couple', en: 'Torque' },
    blurb: { fr: 'Serrage mécanique et couple moteur.', en: 'Fastener torque and engine torque.' },
    base: 'Nm',
    kind: 'affine',
    defaultPair: ['lbf_ft', 'Nm'],
    units: [
      { id: 'mNm', symbol: 'mN·m', system: 'si', name: { fr: 'millinewton-mètre', en: 'millinewton-metre' }, factor: D('0.001') },
      { id: 'Ncm', symbol: 'N·cm', system: 'si', name: { fr: 'newton-centimètre', en: 'newton-centimetre' }, factor: D('0.01') },
      { id: 'Nm', symbol: 'N·m', system: 'si', name: { fr: 'newton-mètre', en: 'newton-metre' }, factor: D(1) },
      { id: 'kgfcm', symbol: 'kgf·cm', system: 'other', name: { fr: 'kilogramme-force centimètre', en: 'kilogram-force centimetre' }, factor: G_N.div(100) },
      { id: 'kgfm', symbol: 'kgf·m', system: 'other', name: { fr: 'kilogramme-force mètre', en: 'kilogram-force metre' }, factor: G_N },
      { id: 'ozf_in', symbol: 'ozf·po', system: 'imperial', name: { fr: 'once-force pouce', en: 'ounce-force inch' }, factor: LBF_N.div(16).times(INCH_M) },
      { id: 'lbf_in', symbol: 'lbf·po', system: 'imperial', name: { fr: 'livre-force pouce', en: 'pound-force inch' }, factor: LBF_N.times(INCH_M) },
      { id: 'lbf_ft', symbol: 'lbf·pi', system: 'imperial', name: { fr: 'livre-force pied', en: 'pound-force foot' }, factor: LBF_N.times(FOOT_M) },
      { id: 'dyncm', symbol: 'dyn·cm', system: 'other', name: { fr: 'dyne-centimètre', en: 'dyne-centimetre' }, factor: D('1e-7') },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'frequency',
    icon: 'graphic_eq',
    name: { fr: 'Fréquence', en: 'Frequency' },
    blurb: { fr: 'Hertz, tours par minute et vitesse angulaire.', en: 'Hertz, revolutions per minute and angular rate.' },
    base: 'Hz',
    kind: 'affine',
    defaultPair: ['rpm', 'Hz'],
    units: [
      { id: 'mHz', symbol: 'mHz', system: 'si', name: { fr: 'millihertz', en: 'millihertz' }, factor: D('0.001') },
      { id: 'Hz', symbol: 'Hz', system: 'si', name: { fr: 'hertz', en: 'hertz' }, factor: D(1) },
      { id: 'kHz', symbol: 'kHz', system: 'si', name: { fr: 'kilohertz', en: 'kilohertz' }, factor: D(1000) },
      { id: 'MHz', symbol: 'MHz', system: 'si', name: { fr: 'mégahertz', en: 'megahertz' }, factor: D('1e6') },
      { id: 'GHz', symbol: 'GHz', system: 'si', name: { fr: 'gigahertz', en: 'gigahertz' }, factor: D('1e9') },
      { id: 'THz', symbol: 'THz', system: 'si', name: { fr: 'térahertz', en: 'terahertz' }, factor: D('1e12') },
      { id: 'rpm', symbol: 'tr/min', system: 'other', name: { fr: 'tour par minute', en: 'revolution per minute' }, factor: D(1).div(60) },
      { id: 'rad_s', symbol: 'rad/s', system: 'si', name: { fr: 'radian par seconde', en: 'radian per second' }, factor: D(1).div(PI.times(2)) },
      { id: 'deg_s', symbol: '°/s', system: 'other', name: { fr: 'degré par seconde', en: 'degree per second' }, factor: D(1).div(360) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'datarate',
    icon: 'network_check',
    name: { fr: 'Débit de données', en: 'Data rate' },
    blurb: {
      fr: 'Les forfaits se vendent en mégabits, les fichiers se copient en mégaoctets.',
      en: 'Plans are sold in megabits, files copy in megabytes.',
    },
    base: 'bit_s',
    kind: 'affine',
    defaultPair: ['Mbit_s', 'MB_s'],
    units: [
      { id: 'bit_s', symbol: 'bit/s', system: 'si', name: { fr: 'bit par seconde', en: 'bit per second' }, factor: D(1) },
      { id: 'kbit_s', symbol: 'kbit/s', system: 'si', name: { fr: 'kilobit par seconde', en: 'kilobit per second' }, factor: D(1000) },
      { id: 'Mbit_s', symbol: 'Mbit/s', system: 'si', name: { fr: 'mégabit par seconde', en: 'megabit per second' }, factor: D('1e6') },
      { id: 'Gbit_s', symbol: 'Gbit/s', system: 'si', name: { fr: 'gigabit par seconde', en: 'gigabit per second' }, factor: D('1e9') },
      { id: 'Tbit_s', symbol: 'Tbit/s', system: 'si', name: { fr: 'térabit par seconde', en: 'terabit per second' }, factor: D('1e12') },
      { id: 'B_s', symbol: { fr: 'o/s', en: 'B/s' }, system: 'si', name: { fr: 'octet par seconde', en: 'byte per second' }, factor: D(8) },
      { id: 'kB_s', symbol: { fr: 'ko/s', en: 'kB/s' }, system: 'si', name: { fr: 'kilooctet par seconde', en: 'kilobyte per second' }, factor: D(8000) },
      { id: 'MB_s', symbol: { fr: 'Mo/s', en: 'MB/s' }, system: 'si', name: { fr: 'mégaoctet par seconde', en: 'megabyte per second' }, factor: D('8e6') },
      { id: 'GB_s', symbol: { fr: 'Go/s', en: 'GB/s' }, system: 'si', name: { fr: 'gigaoctet par seconde', en: 'gigabyte per second' }, factor: D('8e9') },
      { id: 'MiB_s', symbol: { fr: 'Mio/s', en: 'MiB/s' }, system: 'other', name: { fr: 'mébioctet par seconde', en: 'mebibyte per second' }, factor: D(8).times(D(1024).pow(2)) },
      { id: 'GiB_s', symbol: { fr: 'Gio/s', en: 'GiB/s' }, system: 'other', name: { fr: 'gibioctet par seconde', en: 'gibibyte per second' }, factor: D(8).times(D(1024).pow(3)) },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'density',
    icon: 'grain',
    name: { fr: 'Masse volumique', en: 'Density' },
    blurb: { fr: 'Matériaux, liquides et alliages.', en: 'Materials, liquids and alloys.' },
    base: 'kg_m3',
    kind: 'affine',
    defaultPair: ['g_cm3', 'kg_m3'],
    units: [
      { id: 'kg_m3', symbol: 'kg/m³', system: 'si', name: { fr: 'kilogramme par mètre cube', en: 'kilogram per cubic metre' }, factor: D(1) },
      { id: 'g_m3', symbol: 'g/m³', system: 'si', name: { fr: 'gramme par mètre cube', en: 'gram per cubic metre' }, factor: D('0.001') },
      { id: 'g_cm3', symbol: 'g/cm³', system: 'si', name: { fr: 'gramme par centimètre cube', en: 'gram per cubic centimetre' }, factor: D(1000) },
      { id: 'kg_L', symbol: 'kg/L', system: 'si', name: { fr: 'kilogramme par litre', en: 'kilogram per litre' }, factor: D(1000) },
      { id: 'lb_ft3', symbol: 'lb/pi³', system: 'imperial', name: { fr: 'livre par pied cube', en: 'pound per cubic foot' }, factor: POUND_KG.div(FOOT_M.pow(3)) },
      { id: 'lb_in3', symbol: 'lb/po³', system: 'imperial', name: { fr: 'livre par pouce cube', en: 'pound per cubic inch' }, factor: POUND_KG.div(INCH_M.pow(3)) },
      { id: 'lb_gal_us', symbol: 'lb/gal US', system: 'us', name: { fr: 'livre par gallon US', en: 'pound per US gallon' }, factor: POUND_KG.div(GALLON_US_L.div(1000)) },
    ],
  },

  // -------------------------------------------------------------------------
  // Seule catégorie à rapport inverse : doubler la consommation en L/100 km
  // divise par deux le rendement en mpg.
  {
    id: 'fuel',
    icon: 'local_gas_station',
    name: { fr: 'Consommation', en: 'Fuel economy' },
    blurb: {
      fr: 'Rapport inverse : plus de L/100 km signifie moins de mpg.',
      en: 'Inverse relationship: more L/100 km means fewer mpg.',
    },
    base: 'l_100km',
    kind: 'reciprocal',
    defaultPair: ['mpg_us', 'l_100km'],
    positiveOnly: true,
    units: [
      {
        id: 'l_100km', symbol: 'L/100 km', system: 'si', mode: 'direct',
        name: { fr: 'litre aux 100 kilomètres', en: 'litre per 100 kilometres' }, factor: D(1),
        note: { fr: 'Mesure officielle au Canada et en Europe.', en: 'Official measure in Canada and Europe.' },
      },
      {
        id: 'km_L', symbol: 'km/L', system: 'si', mode: 'inverse',
        name: { fr: 'kilomètre par litre', en: 'kilometre per litre' }, constant: D(100),
      },
      {
        id: 'mpg_us', symbol: 'mpg US', system: 'us', mode: 'inverse',
        name: { fr: 'mille par gallon (US)', en: 'mile per gallon (US)' },
        constant: GALLON_US_L.times(100).div(MILE_KM),
        note: { fr: 'Étiquettes de consommation américaines.', en: 'US window-sticker fuel economy.' },
      },
      {
        id: 'mpg_uk', symbol: 'mpg imp.', system: 'imperial', mode: 'inverse',
        name: { fr: 'mille par gallon (imp.)', en: 'mile per gallon (imp.)' },
        constant: GALLON_UK_L.times(100).div(MILE_KM),
        note: { fr: 'Le gallon impérial est plus grand que le gallon US.', en: 'The imperial gallon is larger than the US gallon.' },
      },
    ],
  },
];
