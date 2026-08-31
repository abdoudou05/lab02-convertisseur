import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { alpha } from '@mui/material/styles';

import { NumericValue } from './NumericValue.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { MONO } from '../theme.js';

/**
 * La même valeur, exprimée simultanément dans toutes les unités de la
 * catégorie. C'est souvent plus parlant qu'une conversion isolée : on voit
 * d'un coup d'œil l'ordre de grandeur relatif de chaque unité.
 */
export function AllUnitsTable({ category, conversion, from, to, onSelectUnit, loading, grouping = true }) {
  const { t, locale } = useI18n();

  const units = category?.units ?? [];
  const valueByUnit = new Map((conversion?.all ?? []).map((row) => [row.unit, row]));

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography variant="overline" component="h2" sx={{ color: 'text.secondary', display: 'block' }}>
          {t.allUnits}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.78rem', mt: 0.25 }}>
          {t.allUnitsHelp}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small" aria-label={t.allUnits}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5 }}>{t.unit}</TableCell>
              <TableCell align="right" sx={{ pr: 2.5 }}>{t.value}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {units.map((unit) => {
              const row = valueByUnit.get(unit.id);
              const isTarget = unit.id === to;
              const isSource = unit.id === from;

              const activate = () => onSelectUnit(unit.id);

              return (
                <TableRow
                  key={unit.id}
                  hover
                  tabIndex={0}
                  role="button"
                  aria-label={`${t.unit} ${unit.name}`}
                  aria-current={isTarget ? 'true' : undefined}
                  onClick={activate}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      activate();
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 140ms ease',
                    backgroundColor: isTarget
                      ? (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.13 : 0.08)
                      : 'transparent',
                    '& td': { borderColor: 'divider' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <TableCell sx={{ pl: 2.5, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, minWidth: 0 }}>
                      {/* Filet vertical : marque l'unité de destination sans recourir à la couleur seule. */}
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 2,
                          height: 16,
                          borderRadius: 1,
                          flex: '0 0 auto',
                          alignSelf: 'center',
                          backgroundColor: isTarget ? 'primary.main' : 'transparent',
                        }}
                      />
                      <Box
                        component="span"
                        sx={{
                          fontFamily: MONO,
                          fontSize: '0.8125rem',
                          fontWeight: isTarget ? 700 : 500,
                          color: 'text.primary',
                          minWidth: 58,
                        }}
                      >
                        {unit.symbol}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {unit.name}
                      </Typography>
                      {isSource && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'text.disabled',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            px: 0.625,
                            py: 0.125,
                            flex: '0 0 auto',
                          }}
                        >
                          {t.from}
                        </Box>
                      )}
                      {unit.note && (
                        <Tooltip title={unit.note}>
                          <InfoOutlinedIcon
                            sx={{ fontSize: 14, color: 'text.disabled', flex: '0 0 auto', alignSelf: 'center' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell align="right" sx={{ pr: 2.5, py: 1 }}>
                    {row ? (
                      <NumericValue
                        text={row.text}
                        locale={locale}
                        grouping={grouping}
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: isTarget ? 700 : 400,
                          color: (theme) => (isTarget ? theme.palette.custom.accentText : theme.palette.text.primary),
                        }}
                      />
                    ) : loading ? (
                      <Skeleton width={70} sx={{ ml: 'auto' }} />
                    ) : (
                      <Box component="span" sx={{ color: 'text.disabled', fontFamily: MONO, fontSize: '0.8125rem' }}>
                        ·
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
