import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import FunctionsIcon from '@mui/icons-material/Functions';
import TuneIcon from '@mui/icons-material/Tune';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { UnitSelect } from './UnitSelect.jsx';
import { NumericValue } from './NumericValue.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { compositeText, formatNumberText } from '../utils/number.js';
import { MONO } from '../theme.js';

/** Taille du nombre : large sur écran d'ordinateur, sans jamais déborder sur mobile. */
const NUMBER_SIZE = { xs: '2.125rem', sm: '2.625rem', md: '3rem' };

export function ConverterCard({
  category,
  from,
  to,
  value,
  onValueChange,
  onFromChange,
  onToChange,
  onSwap,
  conversion,
  error,
  pending,
  settings,
  onCopy,
  justCopied,
  inputRef,
  onOpenSettings,
  onOpenCustomUnits,
}) {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const stacked = useMediaQuery(theme.breakpoints.down('md'));
  const [copyMenu, setCopyMenu] = useState(null);

  const units = category?.units ?? [];
  const fromUnit = units.find((unit) => unit.id === from);
  const toUnit = units.find((unit) => unit.id === to);

  const hasValue = String(value ?? '').trim() !== '';
  const resultText = conversion?.result?.text ?? null;
  const grouping = settings.grouping;

  // L'avertissement d'expression n'est pas une alerte : c'est une confirmation.
  const expression = conversion?.input?.expression ?? null;
  const warning = conversion?.warnings?.find((entry) => entry.code !== 'EXPRESSION_EVALUATED') ?? null;

  const composite = settings.showComposite && conversion?.composite
    ? compositeText(conversion.composite, units, locale, { grouping })
    : null;
  const fraction = conversion?.result?.fraction ?? null;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        borderColor: 'divider',
        boxShadow: (th) => `0 1px 2px ${alpha(th.palette.common.black, th.palette.mode === 'dark' ? 0.5 : 0.04)},
                            0 12px 32px -18px ${alpha(th.palette.common.black, th.palette.mode === 'dark' ? 0.7 : 0.16)}`,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          // Sur grand écran, le bouton d'inversion est en position absolue : il
          // sort du flux, et les deux panneaux occupent donc une colonne chacun.
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          position: 'relative',
        }}
      >
        {/* ---------------------------------------------------------- Source */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pb: { xs: 3, sm: 3.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 24 }}>
            <Typography variant="overline" component="label" htmlFor="valeur-source" sx={{ color: 'text.secondary' }}>
              {t.from}
            </Typography>
            {expression && (
              <Tooltip title={t.expressionResult(formatNumberText(conversion.input.text, locale, { grouping }).plain)}>
                <Chip
                  size="small"
                  icon={<FunctionsIcon sx={{ fontSize: 14 }} />}
                  label={(
                    <NumericValue
                      text={conversion.input.text}
                      locale={locale}
                      grouping={grouping}
                      sx={{ fontSize: '0.6875rem' }}
                    />
                  )}
                  sx={{
                    height: 22,
                    borderColor: 'divider',
                    '& .MuiChip-label': { px: 0.75 },
                    '& .MuiChip-icon': { ml: 0.75, color: 'primary.main' },
                  }}
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>

          <InputBase
            id="valeur-source"
            inputRef={inputRef}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="0"
            inputProps={{
              inputMode: 'decimal',
              autoComplete: 'off',
              autoCorrect: 'off',
              spellCheck: false,
              'aria-label': `${t.value} ${fromUnit?.name ?? ''}`,
              'aria-invalid': Boolean(error),
              'aria-describedby': error ? 'erreur-conversion' : undefined,
            }}
            fullWidth
            sx={{
              mt: 0.5,
              mb: 2.25,
              '& input': {
                fontFamily: MONO,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 500,
                fontSize: NUMBER_SIZE,
                lineHeight: 1.15,
                padding: 0,
                color: error ? 'error.main' : 'text.primary',
                transition: 'color 160ms ease',
                '&::placeholder': { color: 'text.disabled', opacity: 1 },
              },
            }}
          />

          <UnitSelect
            inputId="unite-source"
            label={t.unit}
            units={units}
            value={from}
            onChange={onFromChange}
          />
        </Box>

        {/* ------------------------------------------------ Bouton d'inversion */}
        <Box
          sx={{
            position: { xs: 'static', md: 'absolute' },
            left: '50%',
            top: '50%',
            transform: { md: 'translate(-50%, -50%)' },
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            my: { xs: -2.25, md: 0 },
          }}
        >
          <Tooltip title={`${t.swap} · S`}>
            <IconButton
              onClick={onSwap}
              aria-label={t.swap}
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                color: 'text.secondary',
                transition: 'transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1), color 160ms ease, border-color 160ms ease',
                transform: stacked ? 'rotate(90deg)' : 'none',
                '&:hover': {
                  backgroundColor: 'background.paper',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  transform: stacked ? 'rotate(270deg)' : 'rotate(180deg)',
                },
              }}
            >
              <SwapHorizIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* --------------------------------------------------------- Résultat */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            pt: { xs: 3, sm: 3.5 },
            backgroundColor: (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.07 : 0.05),
            borderLeft: { md: '1px solid' },
            borderTop: { xs: '1px solid', md: 'none' },
            borderColor: 'divider',
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 24 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>{t.to}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {pending && <CircularProgress size={13} thickness={5} sx={{ color: 'text.disabled' }} />}
              <Tooltip title={`${t.copy} · C`}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onCopy('valueUnit')}
                    onContextMenu={(event) => { event.preventDefault(); setCopyMenu(event.currentTarget); }}
                    disabled={!resultText}
                    aria-label={t.copy}
                    sx={{ color: justCopied ? 'primary.main' : 'text.secondary' }}
                  >
                    {justCopied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon sx={{ fontSize: 17 }} />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t.copyMenu.value}>
                <span>
                  <IconButton
                    size="small"
                    onClick={(event) => setCopyMenu(event.currentTarget)}
                    disabled={!resultText}
                    aria-label={t.copy}
                    aria-haspopup="menu"
                    sx={{ color: 'text.secondary', width: 22 }}
                  >
                    <Box component="span" sx={{ fontSize: 10, lineHeight: 1 }}>▾</Box>
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* La zone de résultat garde une hauteur stable pour éviter tout saut. */}
          <Box
            aria-live="polite"
            aria-atomic="true"
            sx={{
              mt: 0.5,
              mb: 2.25,
              minHeight: { xs: '2.45rem', sm: '3.02rem', md: '3.45rem' },
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'thin',
            }}
          >
            {resultText !== null ? (
              <NumericValue
                text={resultText}
                locale={locale}
                grouping={grouping}
                sx={{
                  fontSize: NUMBER_SIZE,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  color: (th) => th.palette.custom.accentText,
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontFamily: MONO, fontSize: NUMBER_SIZE, fontWeight: 500,
                  lineHeight: 1.15, color: 'text.disabled',
                }}
              >
                {hasValue ? '·' : '0'}
              </Typography>
            )}
          </Box>

          <UnitSelect
            inputId="unite-cible"
            label={t.unit}
            units={units}
            value={to}
            onChange={onToChange}
          />
        </Box>
      </Box>

      {/* ------------------------------------- Lectures alternatives du résultat */}
      {(composite || fraction) && (
        <Box
          sx={{
            display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3 },
            px: { xs: 2.5, sm: 3.5 }, py: 1.5,
            borderTop: '1px solid', borderColor: 'divider',
            backgroundColor: (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.04 : 0.03),
          }}
        >
          {composite && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', lineHeight: 1.4 }}>
                {t.composite}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO, fontSize: '0.9375rem', fontWeight: 500,
                  color: 'text.primary', whiteSpace: 'nowrap',
                }}
              >
                {composite}
              </Typography>
            </Box>
          )}

          {fraction && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', lineHeight: 1.4 }}>
                {t.fractionLabel}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO, fontSize: '0.9375rem', fontWeight: 500,
                  color: 'text.primary', whiteSpace: 'nowrap',
                }}
              >
                {fraction.exact ? '' : '≈ '}{fraction.text} {toUnit?.symbol}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* ------------------------------------------------- Barre d'information */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: { xs: 2.5, sm: 3.5 },
          py: 1.25,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          justifyContent: 'space-between',
          backgroundColor: (th) => alpha(th.palette.custom.surfaceSunken, th.palette.mode === 'dark' ? 0.5 : 0.55),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0, flex: '1 1 auto' }}>
          {settings.showRatio && conversion?.ratio && fromUnit && toUnit ? (
            <>
              <Typography variant="overline" sx={{ color: 'text.disabled' }}>{t.ratioLabel}</Typography>
              <Typography
                component="p"
                sx={{
                  fontFamily: MONO, fontSize: '0.8125rem', color: 'text.secondary',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                1 {fromUnit.symbol} ={' '}
                <NumericValue
                  text={conversion.ratio.text}
                  locale={locale}
                  grouping={grouping}
                  sx={{ fontSize: 'inherit', color: 'text.primary' }}
                />{' '}
                {toUnit.symbol}
              </Typography>
            </>
          ) : (
            <Typography sx={{ color: 'text.disabled', fontSize: '0.8125rem' }}>
              {category?.blurb}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flex: '0 0 auto' }}>
          {category?.supportsCustomUnits && (
            <Button
              size="small"
              onClick={onOpenCustomUnits}
              sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {t.custom.open}
            </Button>
          )}
          <Button
            size="small"
            startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
            onClick={onOpenSettings}
            sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
          >
            {`${t.precision} ${settings.precision}`}
          </Button>
        </Box>
      </Box>

      {/* ------------------------------------------------ Erreurs et alertes */}
      {(error || warning) && (
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2, pt: 0.5 }}>
          {error && (
            <Alert severity="error" variant="outlined" id="erreur-conversion" sx={{ fontSize: '0.8125rem' }}>
              {error.code === 'NETWORK' ? t.offlineBody : error.message}
            </Alert>
          )}
          {!error && warning && (
            <Alert severity="warning" variant="outlined" sx={{ fontSize: '0.8125rem' }}>
              {warning.message}
            </Alert>
          )}
        </Box>
      )}

      <Menu
        anchorEl={copyMenu}
        open={Boolean(copyMenu)}
        onClose={() => setCopyMenu(null)}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        {['value', 'valueUnit', 'equation', 'json', 'link'].map((format) => (
          <MenuItem
            key={format}
            onClick={() => { onCopy(format); setCopyMenu(null); }}
            sx={{ fontSize: '0.8125rem' }}
          >
            {t.copyMenu[format]}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
