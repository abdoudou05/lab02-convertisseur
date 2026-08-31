/**
 * Client HTTP de l'API de conversion.
 *
 * Toutes les URL sont relatives : en développement Vite relaie « /api » vers
 * le serveur Node, en production le même serveur sert le bundle et l'API.
 */

const BASE = '/api';

export class ApiError extends Error {
  constructor(message, { code = 'NETWORK', status = 0, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, signal, lang, query } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (lang) url.searchParams.set('lang', lang);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('network-unreachable', { code: 'NETWORK' });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiError = payload?.error ?? {};
    throw new ApiError(apiError.message ?? `HTTP ${response.status}`, {
      code: apiError.code ?? 'HTTP_ERROR',
      status: response.status,
      details: apiError.details ?? null,
    });
  }

  return payload;
}

export const fetchCatalogue = (lang, signal) => request('/categories', { lang, signal });

export const fetchHealth = (signal) => request('/health', { signal });

export const requestConversion = (payload, lang, signal) =>
  request('/convert', { method: 'POST', body: payload, lang, signal });

export const requestBatch = (payload, lang, signal) =>
  request('/convert/batch', { method: 'POST', body: payload, lang, signal });

export const requestTable = (params, lang, signal) =>
  request('/table', { query: params, lang, signal });
