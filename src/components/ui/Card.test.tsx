/**
 * Card Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('should render card with children', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <Card title="Test Card">
          <p>Content</p>
        </Card>
      );
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Card');
    });

    it('should render with title and subtitle', () => {
      render(
        <Card title="Main Title" subtitle="Subtitle text">
          <p>Content</p>
        </Card>
      );
      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    });

    it('should render with custom header content', () => {
      render(
        <Card header={<div>Custom Header</div>}>
          <p>Content</p>
        </Card>
      );
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('should prefer custom header over title/subtitle', () => {
      render(
        <Card
          title="Title"
          subtitle="Subtitle"
          header={<div>Custom Header</div>}
        >
          <p>Content</p>
        </Card>
      );
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
    });

    it('should render with footer', () => {
      render(
        <Card footer={<button>Action</button>}>
          <p>Content</p>
        </Card>
      );
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--default');
    });

    it('should render with outlined variant', () => {
      const { container } = render(
        <Card variant="outlined">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--outlined');
    });

    it('should render with elevated variant', () => {
      const { container } = render(
        <Card variant="elevated">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--elevated');
    });
  });

  describe('Padding', () => {
    it('should render with medium padding by default', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--padding-md');
    });

    it('should render with no padding', () => {
      const { container } = render(
        <Card padding="none">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--padding-none');
    });

    it('should render with small padding', () => {
      const { container } = render(
        <Card padding="sm">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--padding-sm');
    });

    it('should render with large padding', () => {
      const { container } = render(
        <Card padding="lg">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card--padding-lg');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Card className="custom-card">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-card');
    });
  });

  describe('HTML Attributes', () => {
    it('should forward HTML attributes', () => {
      const { container } = render(
        <Card data-testid="test-card" aria-label="Test Card">
          <p>Content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-testid', 'test-card');
      expect(card).toHaveAttribute('aria-label', 'Test Card');
    });
  });
});
