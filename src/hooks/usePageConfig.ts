import { useEffect, useRef, useCallback } from 'react';
import { ExcelColumnSettings, ExcelFilter } from './useExcelMode';

const CONFIG_VERSION = 1;
const STORAGE_PREFIX = 'exvored_page_config_';
const DEBOUNCE_DELAY = 500; // ms

export interface PageConfig {
  version: number;
  pageId: string;
  columns: ExcelColumnSettings[];
  filters: ExcelFilter[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export interface PageConfigActions {
  saveConfig: (config: Omit<PageConfig, 'version' | 'pageId'>) => void;
  loadConfig: () => PageConfig | null;
  clearConfig: () => void;
  hasStoredConfig: () => boolean;
}

/**
 * Hook para persistir configuraciones de página en localStorage
 * Guarda automáticamente con debounce para evitar saturar el storage
 */
export function usePageConfig(pageId: string): PageConfigActions {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `${STORAGE_PREFIX}${pageId}`;

  const loadConfig = useCallback((): PageConfig | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const config = JSON.parse(stored) as PageConfig;

      // Verificar versión - si no coincide, descartar configuración antigua
      if (config.version !== CONFIG_VERSION) {
        console.warn(`Config version mismatch for ${pageId}. Clearing old config.`);
        localStorage.removeItem(storageKey);
        return null;
      }

      return config;
    } catch (error) {
      console.error(`Error loading config for ${pageId}:`, error);
      return null;
    }
  }, [pageId, storageKey]);

  const saveConfig = useCallback((config: Omit<PageConfig, 'version' | 'pageId'>) => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      try {
        const fullConfig: PageConfig = {
          version: CONFIG_VERSION,
          pageId,
          ...config
        };

        localStorage.setItem(storageKey, JSON.stringify(fullConfig));
      } catch (error) {
        console.error(`Error saving config for ${pageId}:`, error);
      }
    }, DEBOUNCE_DELAY);
  }, [pageId, storageKey]);

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing config for ${pageId}:`, error);
    }
  }, [pageId, storageKey]);

  const hasStoredConfig = useCallback((): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveConfig,
    loadConfig,
    clearConfig,
    hasStoredConfig
  };
}
