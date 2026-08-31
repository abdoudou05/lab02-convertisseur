import { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import BoltIcon from '@mui/icons-material/Bolt';
import { alpha } from '@mui/material/styles';

import { CategoryIcon } from './CategoryIcon.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { MONO } from '../theme.js';

const MAX_RESULTS = 60;

/**
 * Normalise un libellé pour la recherche : « degre » trouve « degré », et
 * « noeud » trouve « nœud ». La décomposition Unicode NFD ne défait pas les
 * ligatures, elles sont donc développées explicitement au préalable.
 */
const fold = (text) => String(text)
  .toLowerCase()
  .replace(/œ/g, 'oe')
  .replace(/æ/g, 'ae')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '');

/**
 * Recherche rapide (Ctrl/Cmd + K). Trois types de résultats :
 *   une action    : exécutée immédiatement ;
 *   une catégorie : on bascule dessus ;
 *   une unité     : on bascule sur sa catégorie et on la prend comme unité de
 *                   destination, c'est-à-dire la réponse cherchée.
 */
export function CommandPalette({ open, onClose, categories, actions, onPickCategory, onPickUnit }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const items = useMemo(() => {
    const all = [];

    for (const action of actions ?? []) {
      all.push({
        key: `a:${action.id}`,
        kind: 'action',
        action,
        label: action.label,
        hint: t.paletteActions,
        haystack: fold(`${action.label} ${t.paletteActions}`),
      });
    }

    for (const category of categories) {
      all.push({
        key: `c:${category.id}`,
        kind: 'category',
        category,
        label: category.name,
        hint: category.blurb,
        haystack: fold(`${category.name} ${category.blurb ?? ''}`),
      });
      for (const unit of category.units) {
        all.push({
          key: `u:${category.id}:${unit.id}`,
          kind: 'unit',
          category,
          unit,
          label: unit.name,
          hint: category.name,
          haystack: fold(`${unit.name} ${unit.symbol} ${category.name}`),
        });
      }
    }

    const needle = fold(query.trim());
    if (!needle) {
      return all.filter((item) => item.kind !== 'unit');
    }

    return all
      .filter((item) => item.haystack.includes(needle))
      // Les correspondances en début de libellé passent devant.
      .sort((a, b) => a.haystack.indexOf(needle) - b.haystack.indexOf(needle))
      .slice(0, MAX_RESULTS);
  }, [categories, actions, query, t]);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(items.length - 1, 0)));
  }, [items.length]);

  // Garde l'élément actif visible pendant la navigation au clavier.
  useEffect(() => {
    const node = listRef.current?.querySelector('[data-active="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (item) => {
    if (!item) return;
    if (item.kind === 'action') item.action.run();
    else if (item.kind === 'category') onPickCategory(item.category.id);
    else onPickUnit(item.category.id, item.unit.id);
    onClose();
  };

  /*
    Le pilotage au clavier passe par une écoute sur `window` plutôt que par une
    prop onKeyDown : MUI ne transmet pas onKeyDown jusqu'à l'élément <input>, et
    Dialog remplace celle posée sur sa racine. Une écoute globale, active
    uniquement pendant l'ouverture, fonctionne quel que soit l'élément qui a le
    focus, y compris le Paper saisi par le piège à focus.
    Échap reste géré par Dialog lui-même.
  */
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((current) => (items.length ? (current + 1) % items.length : 0));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((current) => (items.length ? (current - 1 + items.length) % items.length : 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        choose(items[active]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { borderRadius: 3, mt: { xs: 2, sm: 8 }, alignSelf: 'flex-start' } },
        backdrop: { sx: { backdropFilter: 'blur(2px)' } },
        // Remise à zéro garantie une fois l'animation de fermeture terminée.
        transition: { onExited: () => { setQuery(''); setActive(0); } },
      }}
      aria-label={t.palette}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.75 }}>
        <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        <InputBase
          autoFocus
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.paletteHint}
          inputProps={{ 'aria-label': t.paletteHint, autoComplete: 'off', spellCheck: false }}
          sx={{ fontSize: '0.95rem' }}
        />
        <Box
          component="kbd"
          sx={{
            fontFamily: MONO, fontSize: '0.6875rem', color: 'text.disabled',
            border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.75, py: 0.25,
            flex: '0 0 auto',
          }}
        >
          Esc
        </Box>
      </Box>

      <Divider />

      <Box
        ref={listRef}
        role="listbox"
        aria-label={t.palette}
        sx={{ maxHeight: 400, overflowY: 'auto', py: 0.75 }}
      >
        {items.length === 0 ? (
          <Typography sx={{ px: 2.5, py: 3, color: 'text.disabled', fontSize: '0.875rem' }}>
            {t.paletteEmpty}
          </Typography>
        ) : (
          items.map((item, index) => {
            const isActive = index === active;
            return (
              <Box
                key={item.key}
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2.5, py: 1, cursor: 'pointer',
                  backgroundColor: isActive
                    ? (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.09)
                    : 'transparent',
                }}
              >
                {item.kind === 'action' ? (
                  <BoltIcon sx={{ fontSize: 17, color: isActive ? 'primary.main' : 'text.disabled', flex: '0 0 auto' }} />
                ) : (
                  <CategoryIcon
                    name={item.category.icon}
                    sx={{ fontSize: 17, color: isActive ? 'primary.main' : 'text.disabled', flex: '0 0 auto' }}
                  />
                )}

                {item.kind === 'unit' && (
                  <Box
                    component="span"
                    sx={{ fontFamily: MONO, fontSize: '0.75rem', color: 'text.secondary', minWidth: 56 }}
                  >
                    {item.unit.symbol}
                  </Box>
                )}

                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: item.kind === 'unit' ? 400 : 600,
                    color: 'text.primary',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </Typography>

                <Typography
                  sx={{
                    ml: 'auto', pl: 1.5, fontSize: '0.75rem', color: 'text.disabled',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%',
                  }}
                >
                  {item.kind === 'action' ? (item.action.shortcut ?? item.hint) : item.hint}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Dialog>
  );
}
