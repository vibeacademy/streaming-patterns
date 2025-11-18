/**
 * useTheme Hook Tests
 *
 * @vitest-environment jsdom
 *
 * Note: This test file uses jsdom instead of happy-dom due to complex DOM mocking requirements.
 * The test heavily mocks document.documentElement and window.matchMedia in ways that happy-dom
 * doesn't support as cleanly as jsdom. This is an acceptable trade-off for this single file.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  let localStorageMock: { [key: string]: string };
  let mediaQueryListMock: {
    matches: boolean;
    media: string;
    onchange: null;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    dispatchEvent: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: vi.fn(() => {
          localStorageMock = {};
        }),
        length: 0,
        key: vi.fn()
      } as Storage,
      writable: true,
      configurable: true
    });

    // Mock matchMedia
    mediaQueryListMock = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    };

    window.matchMedia = vi.fn(() => mediaQueryListMock as MediaQueryList);

    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      value: {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn()
      },
      writable: true,
      configurable: true
    });

    // Mock meta theme-color
    document.querySelector = vi.fn((selector: string) => {
      if (selector === 'meta[name="theme-color"]') {
        return {
          setAttribute: vi.fn()
        } as unknown as Element;
      }
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with system theme when no stored preference', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should initialize with stored theme preference', () => {
      localStorageMock['streamflow-theme'] = 'dark';

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should detect system dark mode preference', () => {
      mediaQueryListMock.matches = true;

      const { result } = renderHook(() => useTheme());

      expect(result.current.systemTheme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should initialize contrast mode from storage', () => {
      localStorageMock['streamflow-contrast'] = 'high';

      const { result } = renderHook(() => useTheme());

      expect(result.current.contrastMode).toBe('high');
    });

    it('should default to normal contrast mode', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.contrastMode).toBe('normal');
    });
  });

  describe('setTheme', () => {
    it('should update theme', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'streamflow-theme',
        'dark'
      );
    });

    it('should support system theme', () => {
      mediaQueryListMock.matches = true;
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark'); // Should follow system
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle from system to opposite of system preference', () => {
      mediaQueryListMock.matches = true; // System is dark
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light'); // Opposite of dark system
    });
  });

  describe('setContrastMode', () => {
    it('should update contrast mode', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setContrastMode('high');
      });

      expect(result.current.contrastMode).toBe('high');
    });

    it('should persist contrast mode to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setContrastMode('high');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'streamflow-contrast',
        'high'
      );
    });
  });

  describe('system preference changes', () => {
    it('should listen for system theme changes', () => {
      renderHook(() => useTheme());

      expect(mediaQueryListMock.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should update system theme when preference changes', async () => {
      const { result } = renderHook(() => useTheme());

      // Simulate system theme change
      act(() => {
        const changeHandler = mediaQueryListMock.addEventListener.mock
          .calls[0][1] as (e: { matches: boolean }) => void;
        changeHandler({ matches: true });
      });

      await waitFor(() => {
        expect(result.current.systemTheme).toBe('dark');
      });
    });

    it('should update resolved theme when system changes and theme is system', async () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      // Simulate system theme change to dark
      act(() => {
        const changeHandler = mediaQueryListMock.addEventListener.mock
          .calls[0][1] as (e: { matches: boolean }) => void;
        changeHandler({ matches: true });
      });

      await waitFor(() => {
        expect(result.current.resolvedTheme).toBe('dark');
      });
    });
  });

  describe('DOM updates', () => {
    it('should apply theme to document element', () => {
      renderHook(() => useTheme());

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-theme',
        expect.any(String)
      );
    });

    it('should apply contrast mode to document element', () => {
      renderHook(() => useTheme());

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-contrast',
        'normal'
      );
    });

    it('should update meta theme-color', () => {
      const metaElement = {
        setAttribute: vi.fn()
      };

      document.querySelector = vi.fn(() => metaElement as unknown as Element);

      renderHook(() => useTheme());

      expect(metaElement.setAttribute).toHaveBeenCalledWith(
        'content',
        expect.any(String)
      );
    });
  });

  describe('resolvedTheme', () => {
    it('should resolve to light when theme is light', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should resolve to dark when theme is dark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should resolve to system preference when theme is system', () => {
      mediaQueryListMock.matches = true;
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useTheme());

      unmount();

      expect(mediaQueryListMock.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save theme'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
