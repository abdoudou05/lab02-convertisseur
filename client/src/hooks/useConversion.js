import { useEffect, useMemo, useRef, useState } from 'react';
import { requestConversion } from '../api/client.js';

const DEBOUNCE_MS = 140;

/**
 * Conversion en direct : chaque frappe déclenche un appel, mais amorti et
 * annulable. Deux choix d'ergonomie importants :
 *
 *   le résultat précédent reste affiché pendant le nouveau calcul, ce qui
 *   évite un clignotement à chaque caractère saisi ;
 *
 *   les réponses arrivées hors séquence sont ignorées, pour qu'une requête
 *   lente ne vienne jamais écraser un résultat plus récent.
 */
export function useConversion({
  category, from, to, value, lang, options, extraUnits, enabled = true,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const sequenceRef = useRef(0);

  // Les objets d'options changent d'identité à chaque rendu : on les réduit à
  // une clé stable pour que l'effet ne se relance pas sans raison.
  const optionsKey = JSON.stringify(options ?? {});
  const extraKey = JSON.stringify(extraUnits ?? []);
  const resolved = useMemo(() => JSON.parse(optionsKey), [optionsKey]);
  const resolvedExtra = useMemo(() => JSON.parse(extraKey), [extraKey]);

  useEffect(() => {
    if (!enabled || !category || !from || !to) return undefined;

    const trimmed = String(value ?? '').trim();
    if (trimmed === '') {
      setData(null);
      setError(null);
      setPending(false);
      return undefined;
    }

    const sequence = ++sequenceRef.current;
    const controller = new AbortController();
    setPending(true);

    const timer = setTimeout(() => {
      const payload = { category, from, to, value: trimmed, ...resolved };
      if (resolvedExtra.length > 0) payload.extraUnits = resolvedExtra;

      requestConversion(payload, lang, controller.signal)
        .then((result) => {
          if (sequence !== sequenceRef.current) return;
          setData(result);
          setError(null);
        })
        .catch((cause) => {
          if (cause.name === 'AbortError' || sequence !== sequenceRef.current) return;
          setError(cause);
          setData(null);
        })
        .finally(() => {
          if (sequence === sequenceRef.current) setPending(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, from, to, value, lang, resolved, resolvedExtra, enabled]);

  return { data, error, pending };
}
