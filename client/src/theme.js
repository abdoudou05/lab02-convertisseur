import { createTheme, alpha } from '@mui/material/styles';

/**
 * Direction artistique : « instrument de mesure ».
 *
 * Trois familles typographiques, chacune avec un rôle strict :
 *   Instrument Serif : les titres, pour la voix éditoriale ;
 *   Inter            : toute l'interface, pour la lisibilité ;
 *   JetBrains Mono   : tous les nombres, en chiffres tabulaires, pour que les
 *                      colonnes de valeurs s'alignent au pixel près.
 */

export const SERIF = "'Instrument Serif', 'Iowan Old Style', Georgia, 'Times New Roman', serif";
export const SANS = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

/**
 * Teintes d'accentuation. Chaque paire est choisie pour rester au-dessus du
 * rapport de contraste 4,5:1 exigé par le niveau AA sur son propre fond :
 * une teinte foncée sur le papier clair, une teinte lumineuse sur l'encre noire.
 */
const ACCENT_COLORS = {
  teal: { light: '#0A6B65', lightStrong: '#075450', dark: '#5EE7D8', darkStrong: '#8DF3E8' },
  indigo: { light: '#3A46A8', lightStrong: '#2C3684', dark: '#A9B4FF', darkStrong: '#C7CEFF' },
  amber: { light: '#8A5300', lightStrong: '#6B4000', dark: '#F5B94A', darkStrong: '#FBD08A' },
  rose: { light: '#A31D57', lightStrong: '#801544', dark: '#FF9EC4', darkStrong: '#FFC2D9' },
  violet: { light: '#5B2BC4', lightStrong: '#46209A', dark: '#C9B2FF', darkStrong: '#DCCCFF' },
  forest: { light: '#1F6B3A', lightStrong: '#17512C', dark: '#74E39B', darkStrong: '#A2EEBC' },
};

const NEUTRALS = {
  light: {
    // Papier chaud plutôt que blanc pur : moins fatigant, plus « imprimé ».
    canvas: '#F6F4EF',
    surface: '#FFFFFF',
    surfaceSunken: '#EFECE4',
    ink: '#16181C',
    inkMuted: '#585E67',
    inkFaint: '#8A9099',
    line: '#E1DDD3',
    lineStrong: '#CFC9BB',
    warn: '#9A4A0B',
  },
  dark: {
    canvas: '#0A0B0D',
    surface: '#141719',
    surfaceSunken: '#1C2023',
    ink: '#F1EFEA',
    inkMuted: '#A2A9B1',
    inkFaint: '#6F767E',
    line: '#262B30',
    lineStrong: '#394046',
    warn: '#F0A93B',
  },
};

/** Échelle d'espacement et tailles selon la densité choisie. */
const DENSITY = {
  compact: { spacing: 7, radius: 10, body: '0.8125rem', control: 32, cardPad: 2 },
  cozy: { spacing: 8, radius: 12, body: '0.875rem', control: 38, cardPad: 2.75 },
  comfortable: { spacing: 9, radius: 14, body: '0.9375rem', control: 44, cardPad: 3.5 },
};

export function buildTheme({ mode = 'light', accent = 'teal', density = 'cozy', animations = true } = {}) {
  const isDark = mode === 'dark';
  const neutral = NEUTRALS[isDark ? 'dark' : 'light'];
  const hue = ACCENT_COLORS[accent] ?? ACCENT_COLORS.teal;
  const scale = DENSITY[density] ?? DENSITY.cozy;

  const accentMain = isDark ? hue.dark : hue.light;
  const accentStrong = isDark ? hue.darkStrong : hue.lightStrong;
  // Teinte réservée aux nombres posés sur un fond teinté : la plus contrastée.
  const accentText = isDark ? hue.dark : hue.lightStrong;

  const tokens = { ...neutral, accent: accentMain, accentStrong, accentText, density, scale };

  return createTheme({
    palette: {
      mode,
      primary: {
        main: accentMain,
        dark: accentStrong,
        light: accentMain,
        contrastText: isDark ? '#08131A' : '#FFFFFF',
      },
      warning: { main: neutral.warn },
      background: { default: neutral.canvas, paper: neutral.surface },
      text: { primary: neutral.ink, secondary: neutral.inkMuted, disabled: neutral.inkFaint },
      divider: neutral.line,
      // Jetons maison, disponibles via theme.palette.custom.
      custom: tokens,
    },

    spacing: scale.spacing,
    shape: { borderRadius: scale.radius },

    typography: {
      fontFamily: SANS,
      fontSize: 14,
      body1: { fontSize: scale.body },
      body2: { fontSize: scale.body },
      h1: { fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 },
      h2: { fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.1 },
      h3: { fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, letterSpacing: '-0.005em' },
      subtitle2: { fontWeight: 600, letterSpacing: '0.02em' },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 },
      // Étiquette de section : petites capitales espacées, façon planche technique.
      overline: {
        fontWeight: 600,
        fontSize: '0.6875rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        lineHeight: 1.6,
      },
    },

    transitions: animations ? {} : { create: () => 'none' },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': { colorScheme: mode },
          body: {
            backgroundColor: neutral.canvas,
            // Trame de fond très discrète : une grille de mesure, pas un décor.
            backgroundImage: `radial-gradient(${alpha(neutral.inkFaint, isDark ? 0.1 : 0.14)} 0.5px, transparent 0.5px)`,
            backgroundSize: '28px 28px',
            WebkitFontSmoothing: 'antialiased',
          },
          // Un anneau de focus unique et visible partout, au clavier seulement.
          '*:focus-visible': {
            outline: `2px solid ${accentMain}`,
            outlineOffset: 2,
            borderRadius: 6,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*': {
              animationDuration: '0.01ms !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
          ...(animations ? {} : {
            '*': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
          }),
          '::selection': { backgroundColor: alpha(accentMain, 0.28) },

          // Impression : on ne garde que le contenu, en noir sur blanc.
          '@media print': {
            body: { backgroundColor: '#FFFFFF', backgroundImage: 'none' },
            '[data-print="hide"]': { display: 'none !important' },
            '[data-print="only"]': { display: 'block !important' },
          },
        },
      },

      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none', borderColor: neutral.line } },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: scale.radius - 2 },
          sizeSmall: { paddingInline: 12 },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: scale.radius - 2,
            transition: animations ? 'background-color 140ms ease, color 140ms ease' : 'none',
          },
        },
      },

      MuiTooltip: {
        defaultProps: { arrow: true, enterDelay: 400 },
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#2A3035' : '#22262B',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 10px',
            maxWidth: 300,
          },
          arrow: { color: isDark ? '#2A3035' : '#22262B' },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 8 },
          outlined: { borderColor: neutral.line },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: scale.radius - 2,
            backgroundColor: isDark ? alpha('#FFFFFF', 0.02) : neutral.surface,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: neutral.line },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: neutral.lineStrong },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: neutral.line },
          head: {
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: neutral.inkMuted,
            backgroundColor: 'transparent',
          },
        },
      },

      MuiDialog: {
        styleOverrides: { paper: { border: `1px solid ${neutral.line}`, backgroundImage: 'none' } },
      },

      MuiDrawer: {
        styleOverrides: { paper: { backgroundImage: 'none', borderColor: neutral.line } },
      },

      MuiAlert: {
        styleOverrides: { root: { borderRadius: scale.radius - 2, alignItems: 'center' } },
      },

      MuiSwitch: {
        styleOverrides: { root: { '& .Mui-checked+.MuiSwitch-track': { opacity: 0.5 } } },
      },
    },
  });
}
