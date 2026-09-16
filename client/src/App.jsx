import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Skeleton from '@mui/material/Skeleton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { AppHeader } from './components/AppHeader.jsx';
import { CategoryRail } from './components/CategoryRail.jsx';
import { ConverterCard } from './components/ConverterCard.jsx';
import { AllUnitsTable } from './components/AllUnitsTable.jsx';
import { HistoryPanel } from './components/HistoryPanel.jsx';
import { ScaleStrip } from './components/ScaleStrip.jsx';
import { BatchPanel } from './components/BatchPanel.jsx';
import { ReferenceTable } from './components/ReferenceTable.jsx';
import { CommandPalette } from './components/CommandPalette.jsx';
import { ShortcutsDialog } from './components/ShortcutsDialog.jsx';
import { SettingsDrawer } from './components/SettingsDrawer.jsx';
import { CustomUnitsDialog } from './components/CustomUnitsDialog.jsx';

import { useCatalogue } from './hooks/useCatalogue.js';
import { useConversion } from './hooks/useConversion.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useI18n } from './i18n/I18nProvider.jsx';
import { clipboardText, formatNumberText, compositeText } from './utils/number.js';
import { conversionOptions } from './settings.js';

const samePair = (a, b) => a.category === b.category && a.from === b.from && a.to === b.to;

/** Lit un état de conversion depuis les paramètres de l'URL. */
function readUrlState() {
  try {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('c');
    if (!category) return null;
    return {
      category,
      from: params.get('de'),
      to: params.get('vers'),
      value: params.get('v'),
    };
  } catch {
    return null;
  }
}

export function App({ settings, updateSettings, resetSettings, mode }) {
  const { t, lang, locale } = useI18n();
  const { categories, formatting, status, error: catalogueError, retry } = useCatalogue(lang);
  const unitCount = useMemo(
    () => categories.reduce((total, item) => total + item.units.length, 0),
    [categories],
  );

  const [categoryId, setCategoryId] = useLocalStorage('convertisseur.categorie', 'length');
  const [pair, setPair] = useLocalStorage('convertisseur.paires', {});
  const [value, setValue] = useLocalStorage('convertisseur.valeur', '1');
  const [history, setHistory] = useLocalStorage('convertisseur.historique', []);
  const [favourites, setFavourites] = useLocalStorage('convertisseur.favoris', []);
  const [customUnits, setCustomUnits] = useLocalStorage('convertisseur.unites', []);

  const [tab, setTab] = useState('convert');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [justCopied, setJustCopied] = useState(false);

  const inputRef = useRef(null);
  const urlApplied = useRef(false);

  // ---------------------------------------------------------------- Sélection

  const baseCategory = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? categories[0] ?? null,
    [categories, categoryId],
  );

  /** Les unités personnalisées de la catégorie courante, fusionnées au catalogue. */
  const categoryCustomUnits = useMemo(
    () => customUnits.filter((unit) => unit.category === baseCategory?.id),
    [customUnits, baseCategory],
  );

  const category = useMemo(() => {
    if (!baseCategory) return null;
    if (categoryCustomUnits.length === 0) return baseCategory;
    return {
      ...baseCategory,
      units: [
        ...baseCategory.units,
        ...categoryCustomUnits.map((unit) => ({
          id: unit.id,
          symbol: unit.symbol,
          name: unit.name,
          system: 'custom',
          note: null,
        })),
      ],
    };
  }, [baseCategory, categoryCustomUnits]);

  /** Les unités mémorisées sont validées contre le catalogue avant usage. */
  const { from, to } = useMemo(() => {
    if (!category) return { from: null, to: null };
    const known = new Set(category.units.map((unit) => unit.id));
    const stored = pair[category.id] ?? {};
    const [defaultFrom, defaultTo] = category.defaultPair;
    return {
      from: known.has(stored.from) ? stored.from : defaultFrom,
      to: known.has(stored.to) ? stored.to : defaultTo,
    };
  }, [category, pair]);

  const setUnits = useCallback((next) => {
    if (!category) return;
    setPair((current) => ({ ...current, [category.id]: { from, to, ...next } }));
  }, [category, from, to, setPair]);

  const handleSwap = useCallback(() => setUnits({ from: to, to: from }), [setUnits, from, to]);

  // Un lien partagé restaure l'état complet, une seule fois au chargement.
  useEffect(() => {
    if (urlApplied.current || categories.length === 0) return;
    urlApplied.current = true;

    const shared = readUrlState();
    if (!shared) return;

    const target = categories.find((item) => item.id === shared.category);
    if (!target) return;

    const known = new Set(target.units.map((unit) => unit.id));
    setCategoryId(target.id);
    setPair((current) => ({
      ...current,
      [target.id]: {
        from: known.has(shared.from) ? shared.from : target.defaultPair[0],
        to: known.has(shared.to) ? shared.to : target.defaultPair[1],
      },
    }));
    if (shared.value) setValue(shared.value);
  }, [categories, setCategoryId, setPair, setValue]);

  // -------------------------------------------------------------- Conversion

  const { data: conversion, error: conversionError, pending } = useConversion({
    category: category?.id,
    from,
    to,
    value,
    lang,
    options: conversionOptions(settings),
    extraUnits: categoryCustomUnits,
    enabled: status === 'ready' && Boolean(category),
  });

  const toUnit = category?.units.find((unit) => unit.id === to) ?? null;
  const fromUnit = category?.units.find((unit) => unit.id === from) ?? null;

  // ------------------------------------------------------------- Historique

  useEffect(() => {
    if (!conversion?.result || !category) return undefined;

    const timer = setTimeout(() => {
      const entry = {
        id: `${category.id}:${from}:${to}:${conversion.input.text}`,
        category: category.id,
        from,
        to,
        value: conversion.input.text,
        result: conversion.result.text,
      };
      setHistory((current) => [entry, ...current.filter((item) => item.id !== entry.id)]
        .slice(0, settings.historyLimit));
    }, 1400);

    return () => clearTimeout(timer);
  }, [conversion, category, from, to, setHistory, settings.historyLimit]);

  const applyEntry = useCallback((entry) => {
    setCategoryId(entry.category);
    setPair((current) => ({ ...current, [entry.category]: { from: entry.from, to: entry.to } }));
    if (entry.value !== undefined) setValue(entry.value);
    setTab('convert');
  }, [setCategoryId, setPair, setValue]);

  const toggleFavourite = useCallback((entry) => {
    const target = { category: entry.category, from: entry.from, to: entry.to };
    setFavourites((current) => (current.some((item) => samePair(item, target))
      ? current.filter((item) => !samePair(item, target))
      : [...current, target]));
  }, [setFavourites]);

  // ------------------------------------------------------ Partage et copie

  const shareLink = useCallback(() => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('c', category?.id ?? '');
    url.searchParams.set('de', from ?? '');
    url.searchParams.set('vers', to ?? '');
    url.searchParams.set('v', conversion?.input?.text ?? value);
    return url.toString();
  }, [category, from, to, conversion, value]);

  const writeClipboard = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ severity: 'success', message: message ?? t.copied });
      return true;
    } catch {
      setToast({ severity: 'error', message: t.copyFailed });
      return false;
    }
  }, [t]);

  const handleCopy = useCallback(async (format = 'valueUnit') => {
    if (!conversion?.result) return;
    const grouping = settings.grouping;
    const resultPlain = formatNumberText(conversion.result.text, locale, { grouping }).plain;
    const inputPlain = formatNumberText(conversion.input.text, locale, { grouping }).plain;

    const payloads = {
      value: resultPlain,
      valueUnit: clipboardText(conversion.result.text, toUnit?.symbol, locale, { grouping }),
      equation: `${inputPlain} ${fromUnit?.symbol ?? ''} = ${resultPlain} ${toUnit?.symbol ?? ''}`.trim(),
      json: JSON.stringify({
        category: conversion.category,
        from: conversion.from,
        to: conversion.to,
        input: conversion.input.text,
        result: conversion.result.text,
        precision: conversion.precision,
        composite: conversion.composite
          ? compositeText(conversion.composite, category?.units ?? [], locale, { grouping })
          : null,
      }, null, 2),
      link: shareLink(),
    };

    const copied = await writeClipboard(
      payloads[format] ?? payloads.valueUnit,
      format === 'link' ? t.shareCopied : t.copied,
    );
    if (copied) {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1400);
    }
  }, [conversion, toUnit, fromUnit, locale, settings.grouping, category, shareLink, writeClipboard, t]);

  const download = useCallback((content, filename) => {
    const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ severity: 'success', message: t.downloaded });
  }, [t]);

  // ------------------------------------------------------- Raccourcis clavier

  useEffect(() => {
    if (!settings.shortcuts) return undefined;

    const isTyping = () => {
      const active = document.activeElement;
      return Boolean(active?.matches('input, textarea, select, [contenteditable="true"]'));
    };

    const onKeyDown = (event) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (modifier || event.altKey) return;

      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setShortcutsOpen(false);
        return;
      }
      if (isTyping()) return;

      const key = event.key.toLowerCase();
      if (key === 's') { event.preventDefault(); handleSwap(); }
      else if (key === 'c') { event.preventDefault(); handleCopy('valueUnit'); }
      else if (key === ',') { event.preventDefault(); setSettingsOpen(true); }
      else if (key === '?') { event.preventDefault(); setShortcutsOpen(true); }
      else if (event.key === '/') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSwap, handleCopy, settings.shortcuts]);

  // ------------------------------------------------------- Actions globales

  const paletteActions = useMemo(() => [
    { id: 'swap', label: t.actions.swap, shortcut: 'S', run: handleSwap },
    { id: 'copy', label: t.actions.copy, shortcut: 'C', run: () => handleCopy('valueUnit') },
    { id: 'share', label: t.actions.share, run: () => handleCopy('link') },
    { id: 'settings', label: t.actions.settings, shortcut: ',', run: () => setSettingsOpen(true) },
    { id: 'custom', label: t.actions.customUnits, run: () => setCustomOpen(true) },
    {
      id: 'theme',
      label: t.actions.theme,
      run: () => updateSettings({ theme: mode === 'dark' ? 'light' : 'dark' }),
    },
    { id: 'print', label: t.actions.print, run: () => window.print() },
    { id: 'clear', label: t.actions.clearHistory, run: () => setHistory([]) },
  ], [t, handleSwap, handleCopy, updateSettings, mode, setHistory]);

  // ------------------------------------------------------------------ Rendus

  if (status === 'error') {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, sm: 12 } }}>
        <Alert
          severity="error"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={retry}>{t.retry}</Button>}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>{t.offlineTitle}</AlertTitle>
          {t.offlineBody}
          <Typography component="pre" variant="caption" sx={{ mt: 1.5, opacity: 0.7 }}>
            npm run dev
          </Typography>
          {catalogueError?.status ? (
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.6 }}>
              HTTP {catalogueError.status}
            </Typography>
          ) : null}
        </Alert>
      </Container>
    );
  }

  const gap = { xs: 2.5, sm: 3 };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 }, pb: { xs: 6, sm: 8 } }}>
      <Box data-print="hide">
        <AppHeader
          mode={mode}
          rulerMotif={settings.rulerMotif}
          categoryCount={categories.length}
          unitCount={unitCount}
          onToggleMode={() => updateSettings({ theme: mode === 'dark' ? 'light' : 'dark' })}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </Box>

      <Box component="main" sx={{ mt: { xs: 3, sm: 4 } }}>
        {status === 'loading' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={268} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
            <Box
              aria-live="polite"
              sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
            >
              {t.loading}
            </Box>
          </Box>
        ) : (
          <>
            <Box data-print="hide">
              <CategoryRail categories={categories} value={category?.id} onChange={setCategoryId} />

              <Tabs
                value={tab}
                onChange={(_event, next) => setTab(next)}
                sx={{
                  mt: { xs: 2, sm: 2.5 },
                  minHeight: 0,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    minHeight: 0, py: 1.25, px: 2, fontSize: '0.8125rem',
                    textTransform: 'none', fontWeight: 500,
                  },
                }}
              >
                <Tab value="convert" label={t.tabs.convert} />
                <Tab value="batch" label={t.tabs.batch} />
                <Tab value="table" label={t.tabs.table} />
              </Tabs>
            </Box>

            <Box
              id="panneau-conversion"
              role="tabpanel"
              aria-labelledby={category ? `categorie-${category.id}` : undefined}
              sx={{ mt: gap }}
            >
              {tab === 'convert' && (
                <>
                  <ConverterCard
                    category={category}
                    from={from}
                    to={to}
                    value={value}
                    onValueChange={setValue}
                    onFromChange={(unit) => setUnits({ from: unit })}
                    onToChange={(unit) => setUnits({ to: unit })}
                    onSwap={handleSwap}
                    conversion={conversion}
                    error={conversionError}
                    pending={pending}
                    settings={settings}
                    onCopy={handleCopy}
                    justCopied={justCopied}
                    inputRef={inputRef}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onOpenCustomUnits={() => setCustomOpen(true)}
                  />

                  {settings.showScale && (
                    <Box sx={{ mt: gap }}>
                      <ScaleStrip
                        category={category}
                        conversion={conversion}
                        to={to}
                        grouping={settings.grouping}
                        onSelectUnit={(unit) => setUnits({ to: unit })}
                      />
                    </Box>
                  )}

                  {(settings.showAllUnits || settings.showHistory) && (
                    <Box
                      sx={{
                        mt: gap,
                        display: 'grid',
                        gap,
                        gridTemplateColumns: {
                          xs: '1fr',
                          lg: settings.showAllUnits && settings.showHistory
                            ? 'minmax(0, 1.35fr) minmax(0, 1fr)'
                            : '1fr',
                        },
                        alignItems: 'start',
                      }}
                    >
                      {settings.showAllUnits && (
                        <AllUnitsTable
                          category={category}
                          conversion={conversion}
                          from={from}
                          to={to}
                          grouping={settings.grouping}
                          loading={pending && !conversion}
                          onSelectUnit={(unit) => setUnits({ to: unit })}
                        />
                      )}

                      {settings.showHistory && (
                        <HistoryPanel
                          categories={categories}
                          entries={history}
                          favourites={favourites}
                          grouping={settings.grouping}
                          onSelect={applyEntry}
                          onToggleFavourite={toggleFavourite}
                          onClear={() => setHistory([])}
                        />
                      )}
                    </Box>
                  )}
                </>
              )}

              {tab === 'batch' && (
                <BatchPanel
                  category={category}
                  from={from}
                  to={to}
                  settings={settings}
                  lang={lang}
                  onDownload={download}
                  onCopy={(text) => writeClipboard(text)}
                />
              )}

              {tab === 'table' && (
                <ReferenceTable
                  category={category}
                  from={from}
                  to={to}
                  settings={settings}
                  lang={lang}
                  onDownload={download}
                />
              )}
            </Box>
          </>
        )}
      </Box>

      <Box
        component="footer"
        data-print="hide"
        sx={{ mt: { xs: 5, sm: 7 }, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.7, display: 'block', maxWidth: '78ch' }}>
          {t.footerNote}
        </Typography>
      </Box>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        categories={categories}
        actions={paletteActions}
        onPickCategory={(next) => { setCategoryId(next); setTab('convert'); }}
        onPickUnit={(nextCategory, unit) => {
          setCategoryId(nextCategory);
          setTab('convert');
          setPair((current) => {
            const target = categories.find((item) => item.id === nextCategory);
            const stored = current[nextCategory] ?? {};
            const [defaultFrom, defaultTo] = target?.defaultPair ?? [];
            const nextFrom = stored.from ?? defaultFrom;
            return {
              ...current,
              // Choisir l'unité déjà en source n'aurait aucun effet : on décale la source.
              [nextCategory]: nextFrom === unit
                ? { from: stored.to ?? defaultTo, to: unit }
                : { from: nextFrom, to: unit },
            };
          });
        }}
      />

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        update={updateSettings}
        reset={resetSettings}
        formatting={formatting}
      />

      <CustomUnitsDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        category={baseCategory}
        units={customUnits}
        onChange={setCustomUnits}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity ?? 'success'}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ fontSize: '0.8125rem' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
