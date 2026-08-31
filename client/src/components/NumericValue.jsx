import Box from '@mui/material/Box';
import { formatNumberText } from '../utils/number.js';
import { MONO } from '../theme.js';

/**
 * Affiche un nombre reçu de l'API selon la convention de la locale, avec
 * l'exposant en exposant typographique lorsque la notation scientifique est
 * utilisée. La valeur complète reste lisible d'un seul tenant par les
 * lecteurs d'écran grâce à `aria-label`.
 */
export function NumericValue({ text, locale, grouping = true, sx, component = 'span' }) {
  const { sign, integer, decimal, fraction, exponent, plain } =
    formatNumberText(text, locale, { grouping });

  return (
    <Box
      component={component}
      aria-label={plain}
      sx={{
        fontFamily: MONO,
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum" 1, "zero" 1',
        // Les espaces de groupement ne doivent jamais provoquer de retour à la ligne.
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      <span aria-hidden="true">
        {sign}{integer}{decimal}{fraction}
        {exponent !== null && (
          <>
            <Box component="span" sx={{ mx: '0.28em', opacity: 0.7 }}>×</Box>
            10
            <Box
              component="sup"
              sx={{ fontSize: '0.62em', lineHeight: 0, verticalAlign: 'super', ml: '0.04em' }}
            >
              {exponent}
            </Box>
          </>
        )}
      </span>
    </Box>
  );
}
