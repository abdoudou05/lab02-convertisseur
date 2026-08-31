import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { alpha } from '@mui/material/styles';

import { NumericValue } from './NumericValue.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { requestTable } from '../api/client.js';
import { toCsv, formatNumberText } from '../utils/number.js';
import { MONO } from '../theme.js';

/**
 * Aide-mémoire imprimable : une suite régulière de valeurs et leur conversion.
 * La feuille de style d'impression masque tout le reste de l'application, ce
 * qui donne une table propre sur papier.
 */
export function ReferenceTable({ category, from, to, settings, lang, onDownload }) {
  const { t, locale } = useI18n();

  const [start, setStart] = useState('1');
  const [step, setStep] = useState('1');
  const [count, setCount] = useState(20);
  const [table, setTable] = useState(null);
  const [error, setError] = useState(null);

  const fromUnit = category?.units.find((unit) => unit.id === from);
  const toUnit = category?.units.find((unit) => unit.id === to);

  useEffect(() => {
    if (!category || !from || !to) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      requestTable({
        category: category.id,
        from,
        to,
        start,
        step,
        count,
        precision: settings.precision,
        precisionMode: settings.precisionMode,
        notation: settings.notation,
        rounding: settings.rounding,
      }, lang, controller.signal)
        .then((payload) => { setTable(payload); setError(null); })
        .catch((cause) => {
          if (cause.name === 'AbortError') return;
          setError(cause);
          setTable(null);
        });
    }, 200);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [category, from, to, start, step, count, settings, lang]);

  const csv = () => toCsv(
    [fromUnit?.symbol ?? from, toUnit?.symbol ?? to],
    (table?.rows ?? []).map((row) => [
      formatNumberText(row.inputFormatted, locale, { grouping: false }).plain,
      formatNumberText(row.text, locale, { grouping: false }).plain,
    ]),
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }} data-print="hide">
        <Typography variant="overline" component="h2" sx={{ color: 'text.secondary', display: 'block' }}>
          {t.table.title}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', mt: 0.25 }}>
          {t.table.help}
        </Typography>
      </Box>

      <Box
        sx={{ px: 2.5, pb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}
        data-print="hide"
      >
        <TextField
          size="small" label={t.table.start} value={start}
          onChange={(event) => setStart(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 104, '& input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
        />
        <TextField
          size="small" label={t.table.step} value={step}
          onChange={(event) => setStep(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 104, '& input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
        />
        <TextField
          size="small" type="number" label={t.table.rows} value={count}
          onChange={(event) => setCount(Math.max(1, Math.min(200, Number(event.target.value) || 1)))}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, max: 200 } }}
          sx={{ width: 104, '& input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
        />

        <Box sx={{ display: 'flex', gap: 1, ml: { sm: 'auto' } }}>
          <Button
            size="small"
            startIcon={<PrintIcon sx={{ fontSize: 17 }} />}
            onClick={() => window.print()}
            sx={{ color: 'text.secondary' }}
          >
            {t.table.print}
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 17 }} />}
            onClick={() => onDownload(csv(), `table-${from}-${to}.csv`)}
            disabled={!table}
            sx={{ color: 'text.secondary' }}
          >
            CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Box sx={{ px: 2.5, pb: 2 }} data-print="hide">
          <Alert severity="error" variant="outlined" sx={{ fontSize: '0.8125rem' }}>
            {error.message}
          </Alert>
        </Box>
      )}

      {/* Titre visible uniquement sur la version imprimée. */}
      <Box sx={{ display: 'none', px: 2.5, pb: 1 }} data-print="only">
        <Typography sx={{ fontWeight: 600 }}>
          {fromUnit?.name} → {toUnit?.name}
        </Typography>
      </Box>

      {table && (
        <TableContainer sx={{ maxHeight: { xs: 'none', md: 560 } }}>
          <Table size="small" stickyHeader aria-label={t.table.title}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 2.5, backgroundColor: 'background.paper' }}>
                  {fromUnit?.symbol ?? from}
                </TableCell>
                <TableCell align="right" sx={{ pr: 2.5, backgroundColor: 'background.paper' }}>
                  {toUnit?.symbol ?? to}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((row, index) => (
                <TableRow
                  key={row.input}
                  hover
                  sx={{
                    // Une ligne sur cinq est soulignée : le regard suit la colonne.
                    ...(index % 5 === 4 && {
                      '& td': { borderBottomColor: (theme) => alpha(theme.palette.text.primary, 0.18) },
                    }),
                  }}
                >
                  <TableCell sx={{ pl: 2.5, py: 0.6 }}>
                    <NumericValue
                      text={row.inputFormatted}
                      locale={locale}
                      grouping={settings.grouping}
                      sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2.5, py: 0.6 }}>
                    <NumericValue
                      text={row.text}
                      locale={locale}
                      grouping={settings.grouping}
                      sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
