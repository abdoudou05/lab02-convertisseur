import { useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { MONO } from '../theme.js';

/** Ordre d'affichage des groupes d'unités : le SI d'abord. */
const SYSTEM_ORDER = ['si', 'metric', 'imperial', 'us', 'other'];

/**
 * Sélecteur d'unité. Un Autocomplete plutôt qu'un Select : avec une quinzaine
 * d'unités par catégorie, pouvoir taper « gal » pour trouver le gallon est
 * nettement plus rapide que de parcourir une liste.
 */
export function UnitSelect({ label, units, value, onChange, inputId }) {
  const { t } = useI18n();

  const options = useMemo(
    () => [...units].sort((a, b) => {
      const rank = SYSTEM_ORDER.indexOf(a.system) - SYSTEM_ORDER.indexOf(b.system);
      return rank !== 0 ? rank : 0;
    }),
    [units],
  );

  const selected = options.find((unit) => unit.id === value) ?? null;

  return (
    <Autocomplete
      id={inputId}
      options={options}
      value={selected}
      onChange={(_event, unit) => unit && onChange(unit.id)}
      groupBy={(unit) => t.systems[unit.system] ?? t.systems.other}
      getOptionLabel={(unit) => `${unit.symbol} · ${unit.name}`}
      isOptionEqualToValue={(option, chosen) => option.id === chosen.id}
      disableClearable
      autoHighlight
      openOnFocus
      slotProps={{ popper: { sx: { zIndex: 1400 } } }}
      filterOptions={(list, state) => {
        const query = state.inputValue.trim().toLowerCase();
        if (!query) return list;
        return list.filter((unit) =>
          `${unit.symbol} ${unit.name}`.toLowerCase().includes(query));
      }}
      renderOption={(props, unit) => {
        const { key, ...rest } = props;
        return (
          <Box component="li" key={key} {...rest} sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
            <Box
              component="span"
              sx={{ fontFamily: MONO, fontSize: '0.8125rem', minWidth: 62, color: 'text.primary' }}
            >
              {unit.symbol}
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{unit.name}</Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
      sx={{
        '& .MuiAutocomplete-groupLabel': {
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight: 2.4,
          color: 'text.secondary',
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.96),
          backdropFilter: 'blur(4px)',
        },
      }}
    />
  );
}
