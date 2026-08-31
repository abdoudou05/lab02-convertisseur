import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';

import { useI18n } from '../i18n/I18nProvider.jsx';
import { formatNumberText } from '../utils/number.js';
import { MONO } from '../theme.js';

/**
 * Règle logarithmique des ordres de grandeur.
 *
 * Une même quantité s'écrit « 0,0000000001 » en kilomètres et « 100 » en
 * nanomètres. Les positionner sur une échelle logarithmique montre d'un coup
 * d'œil combien ces unités sont éloignées les unes des autres, ce qu'un simple
 * tableau de chiffres ne fait pas voir.
 */
export function ScaleStrip({ category, conversion, to, onSelectUnit, grouping }) {
  const { t, locale } = useI18n();

  const points = useMemo(() => {
    const rows = conversion?.all ?? [];
    const usable = rows
      .map((row) => {
        const magnitude = Math.abs(row.number);
        return { ...row, log: magnitude > 0 && Number.isFinite(magnitude) ? Math.log10(magnitude) : null };
      })
      .filter((row) => row.log !== null);

    if (usable.length < 2) return [];

    const logs = usable.map((row) => row.log);
    const min = Math.min(...logs);
    const max = Math.max(...logs);
    const span = max - min || 1;

    return usable.map((row) => ({ ...row, position: ((row.log - min) / span) * 100 }));
  }, [conversion]);

  if (points.length < 2) return null;

  const units = category?.units ?? [];
  const symbolOf = (unitId) => units.find((unit) => unit.id === unitId)?.symbol ?? unitId;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }} data-print="hide">
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Typography variant="overline" component="h2" sx={{ color: 'text.secondary', display: 'block' }}>
          {t.scale}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', mt: 0.25 }}>
          {t.scaleHelp}
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, pb: 3, pt: 2.5 }}>
        <Box sx={{ position: 'relative', height: 54 }}>
          {/* Axe */}
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute', left: 0, right: 0, top: 26, height: 2, borderRadius: 1,
              background: (theme) => `linear-gradient(to right,
                ${alpha(theme.palette.text.primary, 0.08)},
                ${alpha(theme.palette.primary.main, 0.45)},
                ${alpha(theme.palette.text.primary, 0.08)})`,
            }}
          />

          {points.map((point) => {
            const isTarget = point.unit === to;
            const { plain } = formatNumberText(point.text, locale, { grouping });

            return (
              <Tooltip key={point.unit} title={`${plain} ${symbolOf(point.unit)}`}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onSelectUnit(point.unit)}
                  aria-label={`${symbolOf(point.unit)} : ${plain}`}
                  sx={{
                    position: 'absolute',
                    left: `${point.position}%`,
                    top: 0,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    // Les repères se chevauchent forcément quand les unités sont
                    // proches ; celui qui est actif passe devant.
                    zIndex: isTarget ? 2 : 1,
                    '&:hover': { zIndex: 3 },
                    '&:hover .tick': { transform: 'scaleY(1.5)' },
                    '&:hover .label': { opacity: 1 },
                  }}
                >
                  <Box
                    className="label"
                    sx={{
                      fontFamily: MONO,
                      fontSize: '0.625rem',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      color: isTarget ? 'primary.main' : 'text.disabled',
                      fontWeight: isTarget ? 700 : 400,
                      opacity: isTarget ? 1 : 0.55,
                      transition: 'opacity 140ms ease',
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {symbolOf(point.unit)}
                  </Box>
                  <Box
                    className="tick"
                    sx={{
                      width: isTarget ? 3 : 1.5,
                      height: isTarget ? 16 : 11,
                      borderRadius: 1,
                      backgroundColor: isTarget ? 'primary.main' : 'text.disabled',
                      transformOrigin: 'center',
                      transition: 'transform 160ms ease',
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>{t.scaleSmall}</Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>{t.scaleLarge}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}
