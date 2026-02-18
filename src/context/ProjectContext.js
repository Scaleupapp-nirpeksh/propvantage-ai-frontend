import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { projectAccessAPI, api } from '../services/api';

// Paths that are org-wide and should NOT receive a project filter param
const PROJECT_FILTER_EXCLUDED = [
  '/auth/',
  '/project-access/',
  '/users',
  '/roles',
  '/tasks',
  '/notifications',
  '/org-hierarchy',
  '/chat',
  '/invitations',
  '/projects',   // Projects list/detail — dashboard filters client-side instead
];

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [activeProjectId, setActiveProjectIdState] = useState(
    () => localStorage.getItem('activeProjectId') || null
  );
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchMyProjects = useCallback(async () => {
    try {
      const res = await projectAccessAPI.getMyProjects();
      const assignments = res.data?.data || [];
      const projects = assignments.map((a) => a.project).filter(Boolean);
      setMyProjects(projects);
      // If stored activeProjectId is no longer accessible, clear it
      if (activeProjectId && !projects.find((p) => p._id === activeProjectId)) {
        setActiveProjectIdState(null);
        localStorage.removeItem('activeProjectId');
      }
    } catch {
      setMyProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only fetch when user is authenticated — prevents 401 loop on login page
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingProjects(false);
      return;
    }
    fetchMyProjects();
  }, [isAuthenticated, fetchMyProjects]);

  // Global axios interceptor: inject ?project=activeProjectId into all GET requests
  // so every page automatically filters to the selected project.
  useEffect(() => {
    if (!activeProjectId) return;

    const interceptorId = api.interceptors.request.use((config) => {
      const url = config.url || '';
      const isExcluded = PROJECT_FILTER_EXCLUDED.some((path) => url.includes(path));

      if (!isExcluded && (config.method || '').toLowerCase() === 'get') {
        config.params = { ...config.params };
        // Only inject if the caller hasn't already set a project param
        if (!config.params.project) {
          config.params.project = activeProjectId;
        }
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptorId);
    };
  }, [activeProjectId]);

  const setActiveProjectId = (id) => {
    setActiveProjectIdState(id);
    if (id) {
      localStorage.setItem('activeProjectId', id);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  };

  const activeProject = myProjects.find((p) => p._id === activeProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        myProjects,
        activeProjectId,
        activeProject,
        loadingProjects,
        setActiveProjectId,
        refreshProjects: fetchMyProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used inside ProjectProvider');
  return ctx;
};

export default ProjectContext;
