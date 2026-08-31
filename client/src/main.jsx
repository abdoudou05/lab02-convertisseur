import { StrictMode, useCallback, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { App } from './App.jsx';
import { buildTheme } from './theme.js';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { DEFAULT_SETTINGS, mergeSettings } from './settings.js';
import './styles.css';

function Root() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [stored, setStored] = useLocalStorage('convertisseur.reglages', DEFAULT_SETTINGS);

  // Un réglage ajouté après coup ne doit pas invalider les préférences déjà
  // enregistrées : on fusionne toujours avec les valeurs par défaut.
  const settings = useMemo(() => mergeSettings(stored), [stored]);

  const updateSettings = useCallback(
    (patch) => setStored((current) => mergeSettings({ ...mergeSettings(current), ...patch })),
    [setStored],
  );
  const resetSettings = useCallback(() => setStored({ ...DEFAULT_SETTINGS }), [setStored]);

  const mode = settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : settings.theme;

  const theme = useMemo(
    () => buildTheme({
      mode,
      accent: settings.accent,
      density: settings.density,
      animations: settings.animations,
    }),
    [mode, settings.accent, settings.density, settings.animations],
  );

  // Aligne la barre d'adresse mobile et les contrôles natifs sur le thème réel.
  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider>
        <App
          settings={settings}
          updateSettings={updateSettings}
          resetSettings={resetSettings}
          mode={mode}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
