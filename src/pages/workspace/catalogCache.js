// src/pages/workspace/catalogCache.js
// Thin in-memory cache for module field catalogs.
// Avoids repeated GET /workspace/catalog/:module calls within a session.
import { workspaceAPI } from '../../services/api';

const cache = {};

/**
 * Returns the catalog for a given module, fetching it once and caching the result.
 * Resolves to the unwrapped catalog object (res.data.data).
 */
export const getModuleCatalog = (module) => {
  if (cache[module]) return cache[module];
  const promise = workspaceAPI
    .getCatalog(module)
    .then((res) => {
      const catalog = res.data?.data || null;
      cache[module] = Promise.resolve(catalog);
      return catalog;
    })
    .catch((err) => {
      // Remove failed entry so the next call retries.
      delete cache[module];
      return Promise.reject(err);
    });
  cache[module] = promise;
  return promise;
};
