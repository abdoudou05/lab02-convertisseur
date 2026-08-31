import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { MONO } from '../theme.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

function Keys({ keys }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flex: '0 0 auto' }}>
      {keys.map((key) => (
        <Box
          key={key}
          component="kbd"
          sx={{
            fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 600,
            color: 'text.secondary', backgroundColor: 'background.default',
            border: '1px solid', borderColor: 'divider', borderRadius: 1,
            px: 0.75, py: 0.25, minWidth: 22, textAlign: 'center',
          }}
        >
          {key}
        </Box>
      ))}
    </Box>
  );
}

export function ShortcutsDialog({ open, onClose }) {
  const { t } = useI18n();

  const rows = [
    { keys: ['Ctrl', 'K'], label: t.shortcutPalette },
    { keys: ['S'], label: t.shortcutSwap },
    { keys: ['C'], label: t.shortcutCopy },
    { keys: ['/'], label: t.shortcutFocus },
    { keys: [','], label: t.shortcutSettings },
    { keys: ['?'], label: t.shortcuts },
    { keys: ['Esc'], label: t.shortcutClose },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600, pb: 1 }}>{t.shortcuts}</DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {rows.map((row) => (
            <Box
              key={row.label}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.label}</Typography>
              <Keys keys={row.keys} />
            </Box>
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2.5, lineHeight: 1.6 }}>
          {t.shortcutsNote}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
