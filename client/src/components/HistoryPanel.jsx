import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import HistoryIcon from '@mui/icons-material/History';
import { alpha } from '@mui/material/styles';

import { NumericValue } from './NumericValue.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { MONO } from '../theme.js';

/** Retrouve la catégorie et les deux unités d'une entrée dans le catalogue courant. */
function resolve(entry, categories) {
  const category = categories.find((item) => item.id === entry.category);
  if (!category) return null;
  const from = category.units.find((unit) => unit.id === entry.from);
  const to = category.units.find((unit) => unit.id === entry.to);
  if (!from || !to) return null;
  return { category, from, to };
}

export function HistoryPanel({
  categories,
  entries,
  favourites,
  onSelect,
  onToggleFavourite,
  onClear,
  grouping = true,
}) {
  const { t, locale } = useI18n();

  const resolvedFavourites = favourites
    .map((favourite) => ({ favourite, parts: resolve(favourite, categories) }))
    .filter((item) => item.parts);

  const resolvedEntries = entries
    .map((entry) => ({ entry, parts: resolve(entry, categories) }))
    .filter((item) => item.parts);

  const isFavourite = (entry) => favourites.some(
    (favourite) => favourite.category === entry.category
      && favourite.from === entry.from
      && favourite.to === entry.to,
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
      <Box
        sx={{
          px: 2.5, pt: 2, pb: 1.5,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
        }}
      >
        <Box>
          <Typography variant="overline" component="h2" sx={{ color: 'text.secondary', display: 'block' }}>
            {t.history}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.78rem', mt: 0.25 }}>
            {resolvedEntries.length > 0 ? t.reuse : t.historyEmpty}
          </Typography>
        </Box>

        {resolvedEntries.length > 0 && (
          <Button size="small" onClick={onClear} sx={{ color: 'text.secondary', fontSize: '0.75rem', flex: '0 0 auto' }}>
            {t.historyClear}
          </Button>
        )}
      </Box>

      {/* ----------------------------------------------------------- Favoris */}
      {resolvedFavourites.length > 0 && (
        <>
          <Box sx={{ px: 2.5, pb: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
              {t.favourites}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {resolvedFavourites.map(({ favourite, parts }) => (
                <Chip
                  key={`${favourite.category}:${favourite.from}:${favourite.to}`}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => onSelect(favourite)}
                  onDelete={() => onToggleFavourite(favourite)}
                  deleteIcon={<StarIcon sx={{ fontSize: 15 }} />}
                  label={(
                    <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.75rem' }}>
                      {parts.from.symbol} → {parts.to.symbol}
                    </Box>
                  )}
                  sx={{
                    '& .MuiChip-deleteIcon': { color: 'primary.main', '&:hover': { color: 'primary.dark' } },
                  }}
                />
              ))}
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* -------------------------------------------------------- Historique */}
      {resolvedEntries.length === 0 ? (
        <Box
          sx={{
            px: 2.5, py: 5,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, textAlign: 'center',
          }}
        >
          <HistoryIcon sx={{ fontSize: 26, color: 'text.disabled', opacity: 0.6 }} />
          <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.8125rem', maxWidth: 210 }}>
            {t.historyEmpty}
          </Typography>
        </Box>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {resolvedEntries.map(({ entry, parts }) => {
            const starred = isFavourite(entry);
            return (
              <Box
                component="li"
                key={entry.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  borderTop: '1px solid', borderColor: 'divider',
                  '&:first-of-type': { borderTop: 'none' },
                  '&:hover': { backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.03) },
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => onSelect(entry)}
                  aria-label={`${t.reuse} : ${entry.value} ${parts.from.symbol} → ${parts.to.symbol}`}
                  sx={{
                    flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer',
                    background: 'none', border: 'none', font: 'inherit', color: 'inherit',
                    px: 2.5, py: 1.25,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', display: 'block', fontSize: '0.6875rem', mb: 0.25 }}
                  >
                    {parts.category.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.8125rem', color: 'text.secondary' }}>
                      <NumericValue text={entry.value} locale={locale} grouping={grouping} sx={{ fontSize: 'inherit' }} />
                      {' '}{parts.from.symbol}
                    </Box>
                    <ArrowRightAltIcon sx={{ fontSize: 16, color: 'text.disabled', flex: '0 0 auto' }} />
                    <Box
                      component="span"
                      sx={{
                        fontFamily: MONO, fontSize: '0.8125rem', fontWeight: 600,
                        color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      <NumericValue text={entry.result} locale={locale} grouping={grouping} sx={{ fontSize: 'inherit' }} />
                      {' '}{parts.to.symbol}
                    </Box>
                  </Box>
                </Box>

                <Tooltip title={starred ? t.removeFavourite : t.addFavourite}>
                  <IconButton
                    size="small"
                    onClick={() => onToggleFavourite(entry)}
                    aria-label={starred ? t.removeFavourite : t.addFavourite}
                    aria-pressed={starred}
                    sx={{ mr: 1.25, color: starred ? 'primary.main' : 'text.disabled' }}
                  >
                    {starred ? <StarIcon sx={{ fontSize: 17 }} /> : <StarBorderIcon sx={{ fontSize: 17 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
