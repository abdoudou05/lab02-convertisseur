import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import TuneIcon from '@mui/icons-material/Tune';

import { RulerStrip } from './RulerStrip.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { LANGUAGES } from '../i18n/strings.js';
import { SERIF, MONO } from '../theme.js';

/** Bouton d'action de l'en-tête : même traitement pour tous. */
const actionSx = {
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
};

export function AppHeader({
  mode, rulerMotif, categoryCount = 0, unitCount = 0,
  onToggleMode, onOpenPalette, onOpenShortcuts, onOpenSettings,
}) {
  const { t, lang, setLang } = useI18n();

  return (
    <Box component="header">
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 2, flexWrap: 'wrap', pb: 2,
        }}
      >
        {/* ------------------------------------------------------- Signature */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
          <Typography
            variant="h1"
            sx={{ fontFamily: SERIF, fontSize: { xs: '1.75rem', sm: '2.125rem' }, color: 'text.primary' }}
          >
            {t.appName}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'text.disabled',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {t.tagline}
          </Typography>
        </Box>

        {/* --------------------------------------------------------- Réglages */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`${t.paletteOpen} · Ctrl K`}>
            <IconButton onClick={onOpenPalette} aria-label={t.paletteOpen} sx={actionSx}>
              <SearchIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={lang}
            onChange={(_event, next) => next && setLang(next)}
            aria-label={t.language}
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.25, py: 0.5, borderColor: 'divider',
                fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.contrastText',
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              },
            }}
          >
            {LANGUAGES.map((language) => (
              <ToggleButton key={language.id} value={language.id} aria-label={language.label}>
                {language.short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Tooltip title={mode === 'dark' ? t.themeLight : t.themeDark}>
            <IconButton
              onClick={onToggleMode}
              aria-label={mode === 'dark' ? t.themeLight : t.themeDark}
              sx={actionSx}
            >
              {mode === 'dark'
                ? <LightModeOutlinedIcon sx={{ fontSize: 19 }} />
                : <DarkModeOutlinedIcon sx={{ fontSize: 19 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t.shortcuts}>
            <IconButton
              onClick={onOpenShortcuts}
              aria-label={t.shortcuts}
              sx={{ ...actionSx, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <KeyboardIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={`${t.openSettings} · ,`}>
            <IconButton onClick={onOpenSettings} aria-label={t.openSettings} sx={actionSx}>
              <TuneIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {rulerMotif && (
        <RulerStrip sx={{ opacity: (theme) => (theme.palette.mode === 'dark' ? 0.85 : 1) }} />
      )}

      <Typography sx={{ mt: 1.75, fontSize: '0.875rem', color: 'text.secondary', maxWidth: '52ch' }}>
        {t.subtitle(categoryCount, unitCount)}
      </Typography>
    </Box>
  );
}
