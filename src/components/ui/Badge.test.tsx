/**
 * Badge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Label</Badge>);
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      const { container } = render(<Badge>Primary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--primary');
    });
  });

  describe('Variants', () => {
    it('should render with secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--secondary');
    });

    it('should render with success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--success');
    });

    it('should render with warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--warning');
    });

    it('should render with error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--error');
    });

    it('should render with neutral variant', () => {
      const { container } = render(<Badge variant="neutral">Neutral</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--neutral');
    });
  });

  describe('Sizes', () => {
    it('should render with small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--sm');
    });

    it('should render with medium size by default', () => {
      const { container } = render(<Badge>Medium</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--md');
    });

    it('should render with large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--lg');
    });
  });

  describe('Dot Indicator', () => {
    it('should not show dot by default', () => {
      const { container } = render(<Badge>No Dot</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).not.toContain('badge--with-dot');
    });

    it('should show dot when dot prop is true', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('badge--with-dot');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('custom-badge');
    });
  });

  describe('HTML Attributes', () => {
    it('should forward HTML attributes', () => {
      const { container } = render(
        <Badge data-testid="test-badge" aria-label="Test Badge">
          Test
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('data-testid', 'test-badge');
      expect(badge).toHaveAttribute('aria-label', 'Test Badge');
    });
  });
});
