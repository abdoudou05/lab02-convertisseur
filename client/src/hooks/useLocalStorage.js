import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * État persisté dans localStorage.
 *
 * Toute lecture et toute écriture sont protégées : en navigation privée, ou
 * lorsque le navigateur bloque le stockage, le hook se comporte simplement
 * comme un useState ordinaire au lieu de faire tomber l'application.
 */
export function useLocalStorage(key, initialValue) {
  const resolveInitial = useCallback(
    () => (typeof initialValue === 'function' ? initialValue() : initialValue),
    // La valeur initiale n'est lue qu'au premier rendu : la dépendance est volontairement figée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? resolveInitial() : JSON.parse(stored);
    } catch {
      return resolveInitial();
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      // Quota dépassé ou stockage indisponible : l'état reste valable en mémoire.
    }
  }, [value]);

  return [value, setValue];
}
