import { useCallback, useEffect, useState } from 'react';
import { fetchCatalogue } from '../api/client.js';

/**
 * Charge le catalogue des catégories et unités, dans la langue courante.
 * Recharge automatiquement lorsque la langue change, car les noms d'unités
 * sont traduits côté serveur.
 */
export function useCatalogue(lang) {
  const [categories, setCategories] = useState([]);
  const [formatting, setFormatting] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setStatus((current) => (current === 'ready' ? 'ready' : 'loading'));

    fetchCatalogue(lang, controller.signal)
      .then((payload) => {
        if (cancelled) return;
        setCategories(payload.categories);
        setFormatting(payload.formatting ?? null);
        setError(null);
        setStatus('ready');
      })
      .catch((cause) => {
        if (cancelled || cause.name === 'AbortError') return;
        setError(cause);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lang, attempt]);

  return { categories, formatting, status, error, retry };
}
