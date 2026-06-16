// src/pages/workspace/catalogCache.js
// Thin in-memory cache for module field catalogs.
// Avoids repeated GET /workspace/catalog/:module calls within a session.
// Also maps a module + row id to its existing detail route.
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

// Existing detail routes per module (see src/App.js route table).
const DETAIL_ROUTE = {
  leads: (id) => `/leads/${id}`,
  sales: (id) => `/sales/${id}`,
  payments: (id) => `/payments/plans/${id}`,
  tasks: (id) => `/tasks/${id}`,
  channelPartners: (id) => `/channel-partners/${id}`,
};

export const detailRouteFor = (module, id) => {
  if (!id) return null;
  const fn = DETAIL_ROUTE[module];
  return fn ? fn(id) : null;
};
