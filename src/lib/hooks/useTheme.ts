/**
 * useTheme Hook - Theme Management for StreamFlow PM
 *
 * Manages application theme (light/dark/system) with:
 * - localStorage persistence
 * - System preference detection
 * - Smooth theme transitions
 * - High contrast mode support
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, systemTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle theme (currently: {theme})
 *     </button>
 *   );
 * }
 * ```
 */

/* eslint-disable no-undef */
import { useEffect, useState, useCallback } from 'react';

/**
 * Theme options
 * - 'light': Light mode
 * - 'dark': Dark mode
 * - 'system': Follow system preference
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Resolved theme (what's actually displayed)
 * - 'light' or 'dark'
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Contrast mode for accessibility
 */
export type ContrastMode = 'normal' | 'high';

interface UseThemeReturn {
  /**
   * Current theme setting ('light', 'dark', or 'system')
   */
  theme: Theme;

  /**
   * Resolved theme (actual theme being displayed)
   * If theme is 'system', this will be 'light' or 'dark' based on system preference
   */
  resolvedTheme: ResolvedTheme;

  /**
   * System's preferred theme
   */
  systemTheme: ResolvedTheme;

  /**
   * Set the theme
   */
  setTheme: (theme: Theme) => void;

  /**
   * Current contrast mode
   */
  contrastMode: ContrastMode;

  /**
   * Set contrast mode
   */
  setContrastMode: (mode: ContrastMode) => void;

  /**
   * Toggle between light and dark (if currently 'system', sets to opposite of system preference)
   */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'streamflow-theme';
const CONTRAST_STORAGE_KEY = 'streamflow-contrast';
const TRANSITION_DURATION = 200; // ms

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get stored theme from localStorage
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }

  return null;
}

/**
 * Store theme to localStorage
 */
function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
}

/**
 * Get stored contrast mode from localStorage
 */
function getStoredContrastMode(): ContrastMode | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONTRAST_STORAGE_KEY);
    if (stored && ['normal', 'high'].includes(stored)) {
      return stored as ContrastMode;
    }
  } catch (error) {
    console.warn('Failed to read contrast mode from localStorage:', error);
  }

  return null;
}

/**
 * Store contrast mode to localStorage
 */
function storeContrastMode(mode: ContrastMode): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CONTRAST_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to save contrast mode to localStorage:', error);
  }
}

/**
 * Apply theme to document
 */
function applyTheme(
  theme: ResolvedTheme,
  contrastMode: ContrastMode,
  enableTransition = false
): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Enable transitions if requested
  if (enableTransition) {
    root.setAttribute('data-theme-transition', '');

    // Remove transition class after animation completes
    setTimeout(() => {
      root.removeAttribute('data-theme-transition');
    }, TRANSITION_DURATION);
  }

  // Apply theme
  root.setAttribute('data-theme', theme);

  // Apply contrast mode
  root.setAttribute('data-contrast', contrastMode);

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const color = theme === 'dark' ? '#111827' : '#FFFFFF';
    metaThemeColor.setAttribute('content', color);
  }
}

/**
 * Hook to manage application theme
 */
export function useTheme(): UseThemeReturn {
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme() || 'system';
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    return getSystemTheme();
  });

  const [contrastMode, setContrastModeState] = useState<ContrastMode>(() => {
    return getStoredContrastMode() || 'normal';
  });

  // Calculate resolved theme
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? systemTheme : theme;

  /**
   * Set theme and persist to localStorage
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
  }, []);

  /**
   * Set contrast mode and persist to localStorage
   */
  const setContrastMode = useCallback((mode: ContrastMode) => {
    setContrastModeState(mode);
    storeContrastMode(mode);
  }, []);

  /**
   * Toggle between light and dark
   */
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // If currently 'system', toggle to opposite of system preference
      setTheme(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, systemTheme, setTheme]);

  /**
   * Listen for system theme changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  /**
   * Apply theme to document whenever it changes
   */
  useEffect(() => {
    applyTheme(resolvedTheme, contrastMode, true);
  }, [resolvedTheme, contrastMode]);

  return {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    contrastMode,
    setContrastMode,
    toggleTheme
  };
}
