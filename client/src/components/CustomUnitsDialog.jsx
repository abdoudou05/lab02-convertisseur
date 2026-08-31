import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

import { useI18n } from '../i18n/I18nProvider.jsx';
import { MONO } from '../theme.js';

const ID_PATTERN = /^[a-z0-9_-]{1,32}$/i;
const NUMBER_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

/**
 * Gestion des unités personnalisées.
 *
 * Une unité se réduit à un facteur par rapport à l'unité de base de la
 * catégorie : « 1 main = 0,1016 m ». Elles sont enregistrées dans le
 * navigateur et voyagent avec chaque requête ; le serveur ne conserve rien.
 */
export function CustomUnitsDialog({ open, onClose, category, units, onChange }) {
  const { t } = useI18n();

  const [id, setId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [factor, setFactor] = useState('');
  const [error, setError] = useState(null);

  const mine = units.filter((unit) => unit.category === category?.id);
  const baseUnit = category?.units.find((unit) => unit.id === category.base);

  const reset = () => {
    setId(''); setSymbol(''); setName(''); setFactor(''); setError(null);
  };

  const add = () => {
    const trimmedId = id.trim();
    const trimmedFactor = factor.trim().replace(',', '.');

    if (!ID_PATTERN.test(trimmedId)) return setError(t.custom.errorId);
    if (!NUMBER_PATTERN.test(trimmedFactor) || Number(trimmedFactor) <= 0) return setError(t.custom.errorFactor);
    if (category.units.some((unit) => unit.id === trimmedId)) return setError(t.custom.errorConflict);
    if (units.some((unit) => unit.category === category.id && unit.id === trimmedId)) {
      return setError(t.custom.errorConflict);
    }

    onChange([...units, {
      category: category.id,
      id: trimmedId,
      symbol: symbol.trim() || trimmedId,
      name: name.trim() || symbol.trim() || trimmedId,
      factor: trimmedFactor,
    }]);
    reset();
    return undefined;
  };

  const remove = (unit) => {
    onChange(units.filter((entry) => !(entry.category === unit.category && entry.id === unit.id)));
  };

  if (!category) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600, pb: 0.5 }}>
        {t.custom.title}
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 2.5, lineHeight: 1.6 }}>
          {t.custom.help(category.name, baseUnit?.symbol ?? category.base)}
        </Typography>

        {!category.supportsCustomUnits ? (
          <Alert severity="info" variant="outlined" sx={{ fontSize: '0.8125rem' }}>
            {t.custom.unsupported}
          </Alert>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1.2fr' },
                alignItems: 'start',
              }}
            >
              <TextField
                size="small" label={t.custom.id} value={id}
                onChange={(event) => setId(event.target.value)}
                placeholder="main"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
              />
              <TextField
                size="small" label={t.custom.symbol} value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="hh"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
              />
              <TextField
                size="small" label={t.custom.name} value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.custom.namePlaceholder}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small" label={t.custom.factor(baseUnit?.symbol ?? category.base)} value={factor}
                onChange={(event) => setFactor(event.target.value)}
                placeholder="0.1016"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
              />
            </Box>

            {error && (
              <Alert severity="error" variant="outlined" sx={{ mt: 1.5, fontSize: '0.8125rem' }}>
                {error}
              </Alert>
            )}

            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={add}
              sx={{ mt: 1.5, borderColor: 'divider', color: 'text.primary' }}
            >
              {t.custom.add}
            </Button>

            <Box sx={{ mt: 3 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                {t.custom.existing(mine.length)}
              </Typography>

              {mine.length === 0 ? (
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled', py: 1 }}>
                  {t.custom.empty}
                </Typography>
              ) : (
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {mine.map((unit) => (
                    <Box
                      component="li"
                      key={unit.id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, py: 1,
                        borderTop: '1px solid', borderColor: 'divider',
                      }}
                    >
                      <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.8125rem', minWidth: 60 }}>
                        {unit.symbol}
                      </Box>
                      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', flex: 1, minWidth: 0 }}>
                        {unit.name}
                      </Typography>
                      <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.75rem', color: 'text.disabled' }}>
                        × {unit.factor}
                      </Box>
                      <Tooltip title={t.custom.remove}>
                        <IconButton size="small" onClick={() => remove(unit)} aria-label={t.custom.remove}>
                          <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
