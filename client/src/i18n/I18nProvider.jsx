import { createContext, useContext, useEffect, useMemo } from 'react';
import { STRINGS } from './strings.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const I18nContext = createContext(null);

/**
 * Langue de départ : le français, langue de référence de l'application.
 * L'anglais n'est proposé qu'à la demande explicite, et ce choix est ensuite
 * mémorisé, d'où le passage par localStorage plutôt que par navigator.language.
 */
const DEFAULT_LANGUAGE = 'fr';

export function I18nProvider({ children }) {
  const [lang, setLang] = useLocalStorage('convertisseur.lang', DEFAULT_LANGUAGE);

  // L'attribut lang du document conditionne la césure, la lecture d'écran et
  // les guillemets typographiques du navigateur.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const t = STRINGS[lang] ?? STRINGS.fr;
    return { lang, setLang, t, locale: t.locale };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n doit être utilisé à l’intérieur de <I18nProvider>.');
  return context;
}
