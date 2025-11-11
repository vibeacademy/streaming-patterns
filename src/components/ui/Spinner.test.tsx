/**
 * Spinner Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have default label for accessibility', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });

    it('should use custom label', () => {
      render(<Spinner label="Loading data..." />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading data...');
    });

    it('should show label text when showLabel is true', () => {
      render(<Spinner label="Loading..." showLabel />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should hide label text by default', () => {
      render(<Spinner label="Loading..." />);
      const label = screen.getByText('Loading...');
      expect(label.className).toContain('sr-only');
    });
  });

  describe('Sizes', () => {
    it('should render with small size', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with medium size by default', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with large size', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with extra large size', () => {
      const { container } = render(<Spinner size="xl" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render with primary variant by default', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with secondary variant', () => {
      render(<Spinner variant="secondary" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with neutral variant', () => {
      render(<Spinner variant="neutral" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<Spinner className="custom-spinner" />);
      const spinnerContainer = container.querySelector('.custom-spinner');
      expect(spinnerContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<Spinner label="Custom loading message" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
    });

    it('should include screen reader text when label is not shown', () => {
      render(<Spinner label="Loading content" />);
      const srText = screen.getByText('Loading content');
      expect(srText.className).toContain('sr-only');
    });
  });
});
