import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

import { CATEGORY_ICONS } from './categoryIcons.js';

/** Icône d'une catégorie, avec une icône générique si le nom est inconnu. */
export function CategoryIcon({ name, ...props }) {
  const Icon = CATEGORY_ICONS[name] ?? CategoryOutlinedIcon;
  return <Icon {...props} />;
}
