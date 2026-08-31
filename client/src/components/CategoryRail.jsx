import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha } from '@mui/material/styles';
import { CategoryIcon } from './CategoryIcon.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

/**
 * Sélecteur de catégorie.
 *
 * Écrit à la main plutôt qu'avec <Tabs> : la variante défilante de MUI ramenait
 * l'onglet actif hors de vue au montage. Ici la barre se replie sur plusieurs
 * lignes dès qu'il y a la place, toutes les catégories restent donc visibles
 * sur ordinateur, et ne défile horizontalement que sur petit écran.
 *
 * Le motif ARIA « tablist » est respecté : sélection automatique au clavier,
 * tabindex mobile (un seul onglet dans l'ordre de tabulation), flèches, Début et Fin.
 */
export function CategoryRail({ categories, value, onChange }) {
  const { t } = useI18n();
  const listRef = useRef(null);

  // Sur petit écran la barre défile : l'onglet actif doit rester visible même
  // lorsqu'il est choisi ailleurs (recherche rapide, historique).
  useEffect(() => {
    const active = listRef.current?.querySelector('[aria-selected="true"]');
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [value]);

  const move = (event, index) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    let nextIndex = null;

    if (event.key in keys) nextIndex = (index + keys[event.key] + categories.length) % categories.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = categories.length - 1;
    else return;

    event.preventDefault();
    const next = categories[nextIndex];
    onChange(next.id);
    listRef.current?.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <Box
      ref={listRef}
      role="tablist"
      aria-label={t.category}
      aria-orientation="horizontal"
      sx={{
        display: 'flex',
        gap: 0.75,
        flexWrap: { xs: 'nowrap', md: 'wrap' },
        overflowX: { xs: 'auto', md: 'visible' },
        overflowY: { xs: 'hidden', md: 'visible' },
        scrollSnapType: { xs: 'x proximity', md: 'none' },
        pb: { xs: 1, md: 0 },
        // Sur mobile, la barre déborde volontairement des marges du conteneur
        // pour que le défilement parte bien du bord de l'écran.
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        '&::-webkit-scrollbar': { height: 0 },
        scrollbarWidth: 'none',
      }}
    >
      {categories.map((category, index) => {
        const selected = category.id === value;
        return (
          <ButtonBase
            key={category.id}
            role="tab"
            id={`categorie-${category.id}`}
            aria-controls="panneau-conversion"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(category.id)}
            onKeyDown={(event) => move(event, index)}
            disableRipple
            sx={{
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.875,
              height: 38,
              px: 1.75,
              borderRadius: 999,
              border: '1px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              backgroundColor: selected ? 'primary.main' : 'transparent',
              color: selected ? 'primary.contrastText' : 'text.secondary',
              fontSize: '0.8125rem',
              fontWeight: selected ? 600 : 500,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease',
              '&:hover': selected
                ? {}
                : {
                  color: 'text.primary',
                  borderColor: 'text.disabled',
                  backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.04),
                },
            }}
          >
            <CategoryIcon name={category.icon} sx={{ fontSize: 17 }} />
            {category.name}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
