import Decimal from 'decimal.js';

// Précision interne large : les facteurs dérivés (division, puissance) restent
// exacts bien au-delà des 34 chiffres significatifs exposés par l'API.
Decimal.set({ precision: 50, toExpNeg: -30, toExpPos: 40 });

export const D = (value) => new Decimal(value);

/** π avec 40 chiffres significatifs. */
export const PI = D('3.141592653589793238462643383279502884197');

// ---------------------------------------------------------------------------
// Constantes de base EXACTES par définition internationale : accord
// international sur le yard et la livre (1959), 9e édition de la brochure du SI
// (BIPM, 2019) et NIST SP 811.
//
// Les facteurs dérivés sont CALCULÉS à partir de ces constantes plutôt que
// recopiés : impossible d'introduire une faute de frappe dans une décimale.
// ---------------------------------------------------------------------------

/** Pouce international : 0,0254 m exactement (accord de 1959). */
export const INCH_M = D('0.0254');
/** Pied international : 12 po. */
export const FOOT_M = INCH_M.times(12); // 0,3048
/** Verge (yard) internationale : 3 pi. */
export const YARD_M = FOOT_M.times(3); // 0,9144
/** Mille terrestre : 1760 vg. */
export const MILE_M = YARD_M.times(1760); // 1609,344
/** Mille marin international : 1852 m exactement. */
export const NAUTICAL_MILE_M = D('1852');

/** Livre avoirdupois : 0,45359237 kg exactement (accord de 1959). */
export const POUND_KG = D('0.45359237');
/** Once avoirdupois : 1/16 lb. */
export const OUNCE_KG = POUND_KG.div(16); // 0,028349523125
/** Grain : 1/7000 lb. */
export const GRAIN_KG = POUND_KG.div(7000); // 0,00006479891

/** Gallon US liquide : 231 po³ exactement, exprimé en litres. */
export const GALLON_US_L = INCH_M.pow(3).times(231).times(1000); // 3,785411784
/** Gallon impérial : 4,54609 L exactement (Weights and Measures Act 1985). */
export const GALLON_UK_L = D('4.54609');

/** Accélération normale de la pesanteur : 9,80665 m/s² exactement. */
export const G_N = D('9.80665');
/** Livre-force : lb × g_n. */
export const LBF_N = POUND_KG.times(G_N); // 4,4482216152605

/** Atmosphère normale : 101 325 Pa exactement. */
export const ATM_PA = D('101325');
/** Millimètre de mercure conventionnel : 133,322387415 Pa exactement. */
export const MMHG_PA = D('133.322387415');

/** Calorie thermochimique : 4,184 J exactement. */
export const CAL_TH_J = D('4.184');
/** BTU « International Table » : 1055,05585262 J exactement. */
export const BTU_IT_J = D('1055.05585262');

/** Charge élémentaire : 1,602176634 × 10⁻¹⁹ C exactement (SI 2019) → 1 eV en J. */
export const EV_J = D('1.602176634e-19');

/** Vitesse de la lumière dans le vide : 299 792 458 m/s exactement (SI). */
export const C_MS = D('299792458');

/** Année julienne : 365,25 j exactement (définition UAI). */
export const JULIAN_YEAR_S = D('86400').times('365.25'); // 31 557 600
/** Année grégorienne moyenne : 365,2425 j. */
export const GREGORIAN_YEAR_S = D('86400').times('365.2425'); // 31 556 952
/** Mois grégorien moyen : année grégorienne / 12. */
export const GREGORIAN_MONTH_S = GREGORIAN_YEAR_S.div(12); // 2 629 746

/** Année-lumière : c × année julienne (définition UAI) = 9 460 730 472 580 800 m. */
export const LIGHT_YEAR_M = C_MS.times(JULIAN_YEAR_S);
/** Unité astronomique : 149 597 870 700 m exactement (UAI 2012). */
export const AU_M = D('149597870700');
