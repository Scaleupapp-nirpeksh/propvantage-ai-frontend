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

// Insight-source registry (D3). Cached once per session like module catalogs.
let insightSourcesPromise = null;
export const getInsightSources = () => {
  if (insightSourcesPromise) return insightSourcesPromise;
  insightSourcesPromise = workspaceAPI
    .getInsightSources()
    .then((res) => res.data?.data || [])
    .catch((err) => {
      insightSourcesPromise = null; // allow retry on next call
      return Promise.reject(err);
    });
  return insightSourcesPromise;
};

// Existing detail routes per module (see src/App.js route table). Each takes the
// full row, since the target id differs by module — e.g. a payments row is a
// PaymentTransaction whose detail is the *sale's* payment plan (row.sale), not row._id.
const DETAIL_ROUTE = {
  leads: (row) => `/leads/${row._id}`,
  sales: (row) => `/sales/${row._id}`,
  payments: (row) => (row.sale ? `/payments/plans/${row.sale}` : null),
  tasks: (row) => `/tasks/${row._id}`,
  channelPartners: (row) => `/channel-partners/${row._id}`,
  projects: (row) => `/projects/${row._id}`,
};

export const detailRouteFor = (module, row) => {
  if (!row?._id) return null;
  const fn = DETAIL_ROUTE[module];
  return fn ? fn(row) : null;
};
