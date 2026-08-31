import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { alpha } from '@mui/material/styles';

import { NumericValue } from './NumericValue.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { splitValues, toCsv, formatNumberText } from '../utils/number.js';
import { requestBatch } from '../api/client.js';
import { MONO } from '../theme.js';

const SAMPLE = '1\n2.5\n10\n100\n2*50';

/**
 * Conversion par lot : on colle une colonne de valeurs, on obtient la colonne
 * convertie, exportable en CSV. Les lignes fautives sont signalées sans faire
 * échouer le reste du lot.
 */
export function BatchPanel({ category, from, to, settings, lang, onDownload, onCopy }) {
  const { t, locale } = useI18n();

  const [raw, setRaw] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const fromUnit = category?.units.find((unit) => unit.id === from);
  const toUnit = category?.units.find((unit) => unit.id === to);
  const values = splitValues(raw);

  const run = async () => {
    if (values.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const payload = await requestBatch({
        category: category.id,
        from,
        to,
        values,
        precision: settings.precision,
        precisionMode: settings.precisionMode,
        notation: settings.notation,
        rounding: settings.rounding,
      }, lang);
      setResult(payload);
    } catch (cause) {
      setError(cause);
      setResult(null);
    } finally {
      setPending(false);
    }
  };

  const csv = () => {
    if (!result) return '';
    return toCsv(
      [fromUnit?.symbol ?? from, toUnit?.symbol ?? to],
      result.rows.map((row) => [
        row.error ? row.source : formatNumberText(row.input, locale, { grouping: false }).plain,
        row.error ? '' : formatNumberText(row.text, locale, { grouping: false }).plain,
      ]),
    );
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography variant="overline" component="h2" sx={{ color: 'text.secondary', display: 'block' }}>
          {t.batch.title}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', mt: 0.25 }}>
          {t.batch.help}
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, pb: 2 }}>
        <TextField
          multiline
          fullWidth
          minRows={5}
          maxRows={12}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={SAMPLE}
          label={t.batch.input}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ '& textarea': { fontFamily: MONO, fontSize: '0.8125rem', lineHeight: 1.7 } }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={pending ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
            onClick={run}
            disabled={values.length === 0 || pending}
          >
            {t.batch.run}
          </Button>

          <Chip
            size="small"
            variant="outlined"
            label={t.batch.count(values.length)}
            sx={{ fontFamily: MONO, fontSize: '0.75rem' }}
          />

          <Button size="small" onClick={() => setRaw(SAMPLE)} sx={{ color: 'text.secondary' }}>
            {t.batch.sample}
          </Button>

          {result && (
            <Box sx={{ display: 'flex', gap: 1, ml: { sm: 'auto' } }}>
              <Button
                size="small"
                startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                onClick={() => onCopy(csv())}
                sx={{ color: 'text.secondary' }}
              >
                {t.batch.copyCsv}
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 17 }} />}
                onClick={() => onDownload(csv(), `conversion-${from}-${to}.csv`)}
                sx={{ color: 'text.secondary' }}
              >
                CSV
              </Button>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" variant="outlined" sx={{ mt: 1.5, fontSize: '0.8125rem' }}>
            {error.message}
          </Alert>
        )}
      </Box>

      {result && (
        <>
          <Box
            sx={{
              px: 2.5, py: 1, display: 'flex', gap: 2, alignItems: 'center',
              borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.custom.surfaceSunken, 0.5),
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {t.batch.summary(result.converted, result.count)}
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader aria-label={t.batch.title}>
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
                {result.rows.map((row) => (
                  <TableRow key={row.index} hover>
                    <TableCell sx={{ pl: 2.5, py: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {row.error && <ErrorOutlineIcon sx={{ fontSize: 15, color: 'error.main' }} />}
                        <Box
                          component="span"
                          sx={{
                            fontFamily: MONO, fontSize: '0.8125rem',
                            color: row.error ? 'error.main' : 'text.secondary',
                          }}
                        >
                          {row.error
                            ? row.source
                            : <NumericValue text={row.input} locale={locale} grouping={settings.grouping} sx={{ fontSize: 'inherit' }} />}
                        </Box>
                        {row.expression && (
                          <Chip
                            size="small"
                            label="ƒx"
                            sx={{ height: 17, fontSize: '0.625rem', fontFamily: MONO }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2.5, py: 0.75 }}>
                      {row.error ? (
                        <Typography sx={{ fontSize: '0.75rem', color: 'error.main' }}>
                          {t.batch.rowError}
                        </Typography>
                      ) : (
                        <NumericValue
                          text={row.text}
                          locale={locale}
                          grouping={settings.grouping}
                          sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}
