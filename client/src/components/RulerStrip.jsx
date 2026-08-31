import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

/**
 * Bande de graduations façon règle graduée. Purement décorative, elle
 * installe le registre visuel de l'instrument de mesure, donc masquée aux
 * technologies d'assistance.
 */
export function RulerStrip({ height = 14, sx }) {
  const theme = useTheme();
  const { line, lineStrong } = theme.palette.custom;

  return (
    <Box
      aria-hidden="true"
      sx={{
        height,
        width: '100%',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'bottom left, bottom left',
        backgroundSize: `100% ${Math.round(height * 0.45)}px, 100% ${height}px`,
        backgroundImage: `
          repeating-linear-gradient(to right, ${line} 0 1px, transparent 1px 8px),
          repeating-linear-gradient(to right, ${lineStrong} 0 1px, transparent 1px 40px)
        `,
        ...sx,
      }}
    />
  );
}
