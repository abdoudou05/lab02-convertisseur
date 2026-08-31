import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { alpha } from '@mui/material/styles';

import { useI18n } from '../i18n/I18nProvider.jsx';
import { ACCENTS, DENSITIES, THEMES, DEFAULT_SETTINGS } from '../settings.js';
import { MONO } from '../theme.js';

/** Une ligne de réglage : libellé à gauche, contrôle à droite. */
function Row({ label, hint, children, stacked = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: stacked ? 1 : 2,
        py: 1.25,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>{label}</Typography>
        {hint && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.25, lineHeight: 1.5 }}>
            {hint}
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: stacked ? '1 1 auto' : '0 0 auto' }}>{children}</Box>
    </Box>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ px: 3, py: 1.5 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function SettingsDrawer({ open, onClose, settings, update, reset, formatting }) {
  const { t, lang } = useI18n();
  const label = (entry) => entry.label[lang] ?? entry.label.fr;

  const toggle = (key, hint) => (
    <Row label={t.settings[key]} hint={hint}>
      <Switch
        checked={Boolean(settings[key])}
        onChange={(event) => update({ [key]: event.target.checked })}
        inputProps={{ 'aria-label': t.settings[key] }}
      />
    </Row>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 } } } }}
    >
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 2,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid', borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>{t.settings.title}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={t.settings.reset}>
            <IconButton size="small" onClick={reset} aria-label={t.settings.reset}>
              <RestartAltIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} aria-label={t.close}>
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ------------------------------------------------------- Apparence */}
      <Section title={t.settings.appearance}>
        <Row label={t.settings.theme} stacked>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={settings.theme}
            onChange={(_event, next) => next && update({ theme: next })}
            aria-label={t.settings.theme}
          >
            {THEMES.map((entry) => (
              <ToggleButton key={entry.id} value={entry.id} sx={{ fontSize: '0.75rem' }}>
                {label(entry)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Row>

        <Row label={t.settings.accent} stacked>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {ACCENTS.map((entry) => (
              <Tooltip key={entry.id} title={label(entry)}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => update({ accent: entry.id })}
                  aria-label={label(entry)}
                  aria-pressed={settings.accent === entry.id}
                  data-accent={entry.id}
                  sx={{
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', padding: 0,
                    border: '2px solid',
                    borderColor: settings.accent === entry.id ? 'text.primary' : 'transparent',
                    outlineOffset: 2,
                    backgroundColor: 'var(--swatch)',
                    // Chaque pastille montre la teinte telle qu'elle apparaîtra.
                    '--swatch': ACCENT_SWATCH[entry.id],
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Row>

        <Row label={t.settings.density} stacked>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={settings.density}
            onChange={(_event, next) => next && update({ density: next })}
            aria-label={t.settings.density}
          >
            {DENSITIES.map((entry) => (
              <ToggleButton key={entry.id} value={entry.id} sx={{ fontSize: '0.75rem' }}>
                {label(entry)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Row>

        {toggle('animations', t.settings.animationsHint)}
        {toggle('rulerMotif')}
      </Section>

      <Divider />

      {/* --------------------------------------------------------- Nombres */}
      <Section title={t.settings.numbers}>
        <Row label={t.settings.precisionMode} stacked>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={settings.precisionMode}
            onChange={(_event, next) => next && update({ precisionMode: next })}
          >
            <ToggleButton value="significant" sx={{ fontSize: '0.75rem' }}>
              {t.settings.significant}
            </ToggleButton>
            <ToggleButton value="decimals" sx={{ fontSize: '0.75rem' }}>
              {t.settings.decimals}
            </ToggleButton>
          </ToggleButtonGroup>
        </Row>

        <Row
          label={`${t.settings.precision} : ${settings.precision}`}
          hint={settings.precisionMode === 'significant' ? t.settings.significantHint : t.settings.decimalsHint}
          stacked
        >
          <Slider
            value={settings.precision}
            onChange={(_event, next) => update({ precision: next })}
            min={settings.precisionMode === 'decimals' ? 0 : 1}
            max={20}
            step={1}
            marks
            valueLabelDisplay="auto"
            aria-label={t.settings.precision}
            sx={{ mx: 1, width: 'calc(100% - 16px)' }}
          />
        </Row>

        <Row label={t.settings.notation}>
          <TextField
            select
            size="small"
            value={settings.notation}
            onChange={(event) => update({ notation: event.target.value })}
            sx={{ width: 168 }}
          >
            {(formatting?.notations ?? ['auto']).map((entry) => (
              <MenuItem key={entry} value={entry} sx={{ fontSize: '0.8125rem' }}>
                {t.notations[entry] ?? entry}
              </MenuItem>
            ))}
          </TextField>
        </Row>

        <Row label={t.settings.rounding} hint={t.settings.roundingHint}>
          <TextField
            select
            size="small"
            value={settings.rounding}
            onChange={(event) => update({ rounding: event.target.value })}
            sx={{ width: 168 }}
          >
            {(formatting?.roundingModes ?? ['half-up']).map((entry) => (
              <MenuItem key={entry} value={entry} sx={{ fontSize: '0.8125rem' }}>
                {t.roundings[entry] ?? entry}
              </MenuItem>
            ))}
          </TextField>
        </Row>

        <Row label={t.settings.fraction} hint={t.settings.fractionHint}>
          <TextField
            select
            size="small"
            value={settings.fraction ?? 'none'}
            onChange={(event) => update({
              fraction: event.target.value === 'none' ? null : Number(event.target.value),
            })}
            sx={{ width: 118, '& .MuiInputBase-input': { fontFamily: MONO, fontSize: '0.8125rem' } }}
          >
            <MenuItem value="none" sx={{ fontSize: '0.8125rem' }}>{t.settings.off}</MenuItem>
            {(formatting?.fractionDenominators ?? [16]).map((entry) => (
              <MenuItem key={entry} value={entry} sx={{ fontFamily: MONO, fontSize: '0.8125rem' }}>
                1/{entry}
              </MenuItem>
            ))}
          </TextField>
        </Row>

        {toggle('grouping', t.settings.groupingHint)}
      </Section>

      <Divider />

      {/* -------------------------------------------------------- Panneaux */}
      <Section title={t.settings.panels}>
        {toggle('showRatio')}
        {toggle('showComposite', t.settings.compositeHint)}
        {toggle('showScale', t.settings.scaleHint)}
        {toggle('showAllUnits')}
        {toggle('showHistory')}
      </Section>

      <Divider />

      {/* ----------------------------------------------------- Comportement */}
      <Section title={t.settings.behaviour}>
        {toggle('shortcuts', t.settings.shortcutsHint)}
        <Row label={`${t.settings.historyLimit} : ${settings.historyLimit}`} stacked>
          <Slider
            value={settings.historyLimit}
            onChange={(_event, next) => update({ historyLimit: next })}
            min={4}
            max={40}
            step={4}
            marks
            valueLabelDisplay="auto"
            aria-label={t.settings.historyLimit}
            sx={{ mx: 1, width: 'calc(100% - 16px)' }}
          />
        </Row>
      </Section>

      <Box sx={{ px: 3, py: 3, mt: 'auto' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={reset}
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': { borderColor: 'text.disabled', backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.04) },
          }}
        >
          {t.settings.resetAll}
        </Button>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', mt: 1.5, textAlign: 'center' }}>
          {t.settings.storedLocally}
        </Typography>
      </Box>
    </Drawer>
  );
}

/** Pastilles de couleur du sélecteur d'accentuation. */
const ACCENT_SWATCH = {
  teal: '#0F8C84',
  indigo: '#4A57C4',
  amber: '#C07A11',
  rose: '#C42A6E',
  violet: '#6F3BE0',
  forest: '#2A8A4C',
};

export { DEFAULT_SETTINGS };
