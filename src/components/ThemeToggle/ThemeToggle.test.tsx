/**
 * ThemeToggle Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

// Mock the useTheme hook
vi.mock('../../lib/hooks/useTheme', () => ({
  useTheme: vi.fn()
}));

import { useTheme } from '../../lib/hooks/useTheme';

describe('ThemeToggle', () => {
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render toggle button', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button', {
        name: /switch to dark mode/i
      });
      expect(button).toBeInTheDocument();
    });

    it('should display sun icon in light mode', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should display moon icon in dark mode', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        systemTheme: 'dark',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('should render without label by default', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      expect(screen.queryByText('Light')).not.toBeInTheDocument();
    });

    it('should render with label when showLabel is true', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle showLabel />);

      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should render dark label when in dark mode', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        systemTheme: 'dark',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle showLabel />);

      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call toggleTheme when clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockToggleTheme).toHaveBeenCalledOnce();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();

      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockToggleTheme).toHaveBeenCalledOnce();
    });
  });

  describe('size variants', () => {
    it('should apply small size class', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      const { container } = render(<ThemeToggle size="sm" />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('toggle--sm');
    });

    it('should apply medium size class by default', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      const { container } = render(<ThemeToggle />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('toggle--md');
    });

    it('should apply large size class', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      const { container } = render(<ThemeToggle size="lg" />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('toggle--lg');
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      const { container } = render(<ThemeToggle className="custom-class" />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels in light mode', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(button).toHaveAttribute('title', 'Switch to dark mode');
    });

    it('should have proper ARIA labels in dark mode', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        systemTheme: 'dark',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(button).toHaveAttribute('title', 'Switch to light mode');
    });

    it('should have button type', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        systemTheme: 'light',
        setTheme: vi.fn(),
        contrastMode: 'normal',
        setContrastMode: vi.fn(),
        toggleTheme: mockToggleTheme
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
